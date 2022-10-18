import type { Provider } from "@ethersproject/providers";
import { BigNumber, Signer, Wallet } from "ethers";
import { SUPPORTED_CHAINS } from "./constants";
import { SafeSingleton, SafeSingleton__factory } from "./typechain";
import { Address } from "./utils";

type WalletOpts = {
    provider: Provider;
    signer: Wallet | Signer;
    walletAddress: Address;
};

// Helper class to interact with a safe wallet and send
// transactions through a relayer.
export class Safe {
    public safe: SafeSingleton;

    // Creates a new Wallet class.
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

    // Shouldn't be called directly.
    // Create the Safe class through 'create' for safety checks.
    protected constructor(public provider: Provider, signer: Wallet | Signer, walletAddress: Address) {
        signer = signer.connect(provider);
        this.safe = SafeSingleton__factory.connect(walletAddress, signer);
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

    // The owners of the safe.
    public async getOwners(): Promise<Address[]> {
        return this.safe.getOwners();
    }

    // The threshold of the safe..
    public async getThreshold(): Promise<Number> {
        const threshold = await this.safe.getThreshold();
        /**
         *
         * The threshold is the minimum signatures required to exec a transaction.
         *
         */
        return Number(threshold);
    }

    // The current nonce.
    public async getNonce(): Promise<number> {
        const nonce = await this.safe.nonce();
        return Number(nonce);
    }

    // The version of the safe.
    public async getVersion(): Promise<string> {
        return this.safe.VERSION();
    }

    // The singleton of the safe, where all calls are delegated.
    public async getSingleton(): Promise<any> {
        // The singleton is stored at storage slot 0.
        let singleton = await this.provider.getStorageAt(this.safe.address, 0);
        singleton = "0x" + singleton.slice(26);
        return singleton;
    }
}
