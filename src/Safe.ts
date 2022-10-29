import { ethers, BigNumber, Signer, Wallet, providers } from "ethers";
import { GAS_PRICE, GAS_TOKEN, SUPPORTED_CHAINS } from "./constants";
import { SafeSingleton, SafeSingleton__factory } from "./typechain";
import { Address, encodeFunctionData, getTxHash, sign } from "./utils";
import { verifyAddOwnerWithThreshold } from "./utils/verifiers";

import type { Provider } from "@ethersproject/providers";

type SendTxOpts = {
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

    /// Creates a new Wallet class.
    static async create(opts: WalletOpts): Promise<Safe> {
        const { provider, signer, walletAddress } = opts;

        let networkName: string = (await provider.getNetwork()).name;
        networkName = networkName === "homestead" ? "mainnet" : networkName;

        if (!SUPPORTED_CHAINS.includes(networkName)) {
            throw new Error(`Unsupported chain: ${networkName}`);
        }

        const safe = new this(provider, signer, walletAddress);
        return safe;
    }

    /// Shouldn't be called directly.
    /// Create the Safe class through 'create' for safety checks.
    protected constructor(public provider: Provider, signer: Wallet, walletAddress: Address) {
        this.signer = signer.connect(provider);
        this.safe = SafeSingleton__factory.connect(walletAddress, signer);
        this.signerAddress = signer.address;
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
        tx.to = this.safe.address;
        tx.data = encodeFunctionData(SafeSingleton__factory.abi, "addOwnerWithThreshold", [newOwner, threshold]);
        tx.safeTxGas = BigNumber.from(gasOpts.gasLimit);
        tx.refundReceiver = gasOpts.relayer;
        const hash = await this._getInternalHash(tx.data, tx.safeTxGas, tx.refundReceiver);
        tx.signatures = await sign(this.signer, hash);

        return tx;
    }

    /// Returns the tx object to send Eth.
    /// @param _value Amount in ETH not WEI. It is transformed here.
    public async sendEth(to: Address, _value: number, gasOpts: GasOpts): Promise<SendTxOpts> {
        const value = ethers.utils.parseEther(_value.toString());

        const currentBalance = await this.provider.getBalance(this.safe.address);

        if (currentBalance.lt(value)) {
            throw new Error("Insufficient balance");
        }

        const hash = await this._getExternalHash(to, value, "0x", BigNumber.from(gasOpts.gasLimit), gasOpts.relayer);

        const tx = mockTx;
        tx.to = to;
        tx.value = value;
        tx.safeTxGas = BigNumber.from(gasOpts.gasLimit);
        tx.refundReceiver = gasOpts.relayer;
        tx.signatures = await sign(this.signer, hash);

        return tx;
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
