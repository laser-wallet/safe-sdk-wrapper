import { ethers, BigNumber, Signer, Wallet, providers } from "ethers";
import { GAS_PRICE, GAS_TOKEN, SAFE_FUNCTIONS, SUPPORTED_CHAINS } from "./constants";
import { SafeSingleton, SafeSingleton__factory } from "./typechain";
import { Erc20Abi__factory } from "./typechain/factories/Erc20Abi__factory";
import { Address, encodeFunctionData, getTxHash, sign } from "./utils";
import { verifyAddOwnerWithThreshold } from "./utils/verifiers";

import type { Provider } from "@ethersproject/providers";

import erc20Abi from "./abis/erc20.abi.json";
import { sanitizeAddresses } from "./utils/sanitizers";

export type SendTxOpts = {
    signer: Address;
    to: Address;
    value: BigNumber;
    data: string;
    operation: 0;
    safeTxGas: BigNumber;
    baseGas: BigNumber;
    gasPrice: BigNumber;
    gasToken: Address;
    refundReceiver: Address;
    signatures: string;
};

type GasOpts = {
    gasLimit: number | BigNumber;
    relayer: Address;
};

type WalletOpts = {
    provider: Provider;
    signer: Wallet;
    walletAddress: Address;
};

const mockTx: SendTxOpts = {
    signer: "",
    to: "",
    value: BigNumber.from(0),
    data: "0x",
    operation: 0,
    safeTxGas: BigNumber.from(0),
    baseGas: BigNumber.from(30000),
    gasPrice: GAS_PRICE, // Will default to 'tx.gasPrice'.
    gasToken: GAS_TOKEN,
    refundReceiver: "0x",
    signatures: "0x",
};

export class Safe {
    public safe: SafeSingleton;
    public signerAddress: Address;

    private signer: Wallet;

    constructor(public provider: Provider, signer: Wallet, walletAddress: Address) {
        this.signer = signer.connect(provider);
        this.safe = SafeSingleton__factory.connect(walletAddress, this.signer);
        this.signerAddress = signer.address;
    }

    async init(): Promise<void> {
        let networkName: string = (await this.provider.getNetwork()).name;
        networkName = networkName === "homestead" ? "mainnet" : networkName;

        if (!SUPPORTED_CHAINS.includes(networkName)) {
            throw new Error(`Unsupported chain: ${networkName}`);
        }
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW METHODS
    //////////////////////////////////////////////////////////////*/

    /**
     *
     *
     *     There are more view methods, but these are the only
     *     relevant for now ...
     *
     */

    /// The owners of the safe.
    public async getOwners(): Promise<Address[]> {
        return this.safe.getOwners();
    }

    /// The threshold of the safe.
    public async getThreshold(): Promise<number> {
        const threshold = await this.safe.getThreshold();
        /**
         *
         * The threshold is the minimum signatures required to exec a transaction.
         *
         */
        return Number(threshold);
    }

    /// The current nonce.
    public async getNonce(): Promise<number> {
        const nonce = await this.safe.nonce();
        return Number(nonce);
    }

    /// The version of the safe.
    public async getVersion(): Promise<string> {
        return this.safe.VERSION();
    }

    /// The singleton of the safe, where all calls are delegated.
    public async getSingleton(): Promise<any> {
        // The singleton is stored at storage slot 0.
        let singleton = await this.provider.getStorageAt(this.safe.address, 0);
        singleton = "0x" + singleton.slice(26);
        return singleton;
    }

    /*//////////////////////////////////////////////////////////////
                           EXECUTION METHODS
    //////////////////////////////////////////////////////////////*/

    /// Returns the tx object to add an owner. It can optionally change the threshold.
    public async addOwnerWithThreshold(newOwner: Address, gasOpts: GasOpts, threshold?: number): Promise<SendTxOpts> {
        const owners = await this.getOwners();
        threshold = threshold ?? (await this.getThreshold());

        verifyAddOwnerWithThreshold(owners, newOwner, threshold, this.signerAddress);

        const tx = mockTx;
        tx.signer = this.signer.address;
        tx.to = this.safe.address;
        tx.data = encodeFunctionData(SafeSingleton__factory.abi, SAFE_FUNCTIONS.addOwnerWithThreshold, [
            newOwner,
            threshold,
        ]);
        tx.safeTxGas = BigNumber.from(gasOpts.gasLimit);
        tx.refundReceiver = gasOpts.relayer;
        const hash = await this._getInternalHash(tx.data, tx.safeTxGas, tx.refundReceiver);
        tx.signatures = await sign(this.signer, hash);

        return tx;
    }

    /// Returns the tx object to send Eth.
    /// @param _value Amount in ETH not WEI. It is transformed here.
    public async sendEth(to: Address, _value: number | string, gasOpts: GasOpts): Promise<SendTxOpts> {
        const value = ethers.utils.parseEther(_value.toString());

        const currentBalance = await this.provider.getBalance(this.safe.address);

        if (currentBalance.lt(value)) {
            throw new Error("Insufficient balance");
        }

        const hash = await this._getExternalHash(to, value, "0x", BigNumber.from(gasOpts.gasLimit), gasOpts.relayer);

        const tx = mockTx;
        tx.signer = this.signer.address;
        tx.to = to;
        tx.value = value;
        tx.safeTxGas = BigNumber.from(gasOpts.gasLimit);
        tx.refundReceiver = gasOpts.relayer;
        tx.signatures = await sign(this.signer, hash);

        return tx;
    }

    /// Returns the tx object to send an ERC-20 compatible token.
    /// @param value Amount of tokens to send.
    /// @notice This function adds the proper decimals, THE VALUE SHOULD BE WITHOUT DECIMALS.
    public async transferERC20(
        tokenAddress: Address,
        to: Address,
        value: number,
        gasOpts: GasOpts
    ): Promise<SendTxOpts> {
        [tokenAddress, to] = sanitizeAddresses([tokenAddress, to]);
        const tokenContract = Erc20Abi__factory.connect(tokenAddress, this.provider);

        let decimals: number;
        try {
            decimals = await tokenContract.decimals();
        } catch (e) {
            throw new Error(`Could not get the token's decimals for address: ${tokenAddress}: ${e}`);
        }

        const transferAmount = ethers.utils.parseUnits(value.toString(), decimals);

        const safeBalance = await tokenContract.balanceOf(this.safe.address);
        if (safeBalance.lt(transferAmount)) throw new Error("Insufficient balance");

        const data = encodeFunctionData(Erc20Abi__factory.abi, "transfer", [to, transferAmount]);
        const hash = await this._getExternalHash(
            to,
            BigNumber.from(0),
            data,
            BigNumber.from(gasOpts.gasLimit),
            gasOpts.relayer
        );

        const tx = mockTx;
        tx.signer = this.signer.address;
        tx.to = to;
        tx.value = BigNumber.from(0);
        tx.data = data;
        tx.safeTxGas = BigNumber.from(gasOpts.gasLimit);
        tx.refundReceiver = gasOpts.relayer;
        tx.signatures = await sign(this.signer, hash);

        return tx;
    }

    /// Generic function to send a safe transaction without relayer.
    public async sendTransaction(tx: SendTxOpts): Promise<ethers.ContractTransaction> {
        try {
            const txResponse = await this.safe.execTransaction(
                tx.to,
                tx.value,
                tx.data,
                tx.operation,
                tx.safeTxGas,
                tx.baseGas,
                tx.gasPrice,
                tx.gasToken,
                tx.refundReceiver,
                tx.signatures
            );
            return txResponse;
        } catch (e) {
            throw new Error(`Error sending transaction: ${e}`);
        }
    }

    /*//////////////////////////////////////////////////////////////
                                HELPERS
    //////////////////////////////////////////////////////////////*/

    /// Returns the hash for internal transactions.
    /// to = address(this).
    private async _getInternalHash(data: string, safeTxGas: BigNumber, relayer: Address): Promise<string> {
        const hash = await getTxHash(this.safe, {
            to: this.safe.address,
            value: BigNumber.from(0),
            data,
            safeTxGas,
            baseGas: mockTx.baseGas,
            gasPrice: GAS_PRICE,
            gasToken: GAS_TOKEN,
            refundReceiver: relayer,
        });

        return hash;
    }

    /// Returns the hash for external transactions.
    private async _getExternalHash(
        to: Address,
        value: BigNumber,
        data: string,
        safeTxGas: BigNumber,
        relayer: Address
    ): Promise<string> {
        const hash = await getTxHash(this.safe, {
            to,
            value,
            data,
            safeTxGas,
            baseGas: mockTx.baseGas,
            gasPrice: GAS_PRICE,
            gasToken: GAS_TOKEN,
            refundReceiver: relayer,
        });

        return hash;
    }
}
