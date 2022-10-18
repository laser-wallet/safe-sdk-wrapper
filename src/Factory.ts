import type { Provider } from "@ethersproject/providers";
import { BigNumber, providers, Wallet } from "ethers";
import { SAFE_SINGLETON, SAFE_FACTORY, SUPPORTED_CHAINS } from "./constants";
import { Address, encodeFunctionData, getInitializer, InitOpts } from "./utils";
import { SafeFactory, SafeFactory__factory } from "./typechain";
import { calculateDeploymentGas } from "./utils/gas";

type FactoryOpts = {
    provider: Provider;
    signer: Wallet;
};

// Factory that deploys safe contracts through a relayer.
export class Factory {
    factory: SafeFactory;

    // Creates a new factory.
    static async create(opts: FactoryOpts): Promise<Factory> {
        const { provider, signer } = opts;

        let networkName: string = (await provider.getNetwork()).name;
        networkName = networkName === "homestead" ? "mainnet" : networkName;

        if (!SUPPORTED_CHAINS.includes(networkName)) {
            throw new Error(`Unsupported chain: ${networkName}`);
        }

        const factory = new this(provider, signer);
        return factory;
    }

    // Shouldn't be called directly.
    // Create the factory through 'create' for safety checks.
    protected constructor(public provider: Provider, signer: Wallet) {
        signer = signer.connect(provider);
        this.factory = SafeFactory__factory.connect(SAFE_FACTORY, signer);
    }

    // Calculates the proxy (safe) address in advance.
    public async calculateProxyAddress(initOpts: InitOpts): Promise<Address> {
        const initializer = getInitializer(initOpts);
        return this._calculateProxyAddress(initOpts.saltNonce, initializer);
    }

    // Creates a new a proxy.
    public async createProxy(initOpts: InitOpts): Promise<providers.TransactionResponse> {
        const initializer = getInitializer(initOpts);
        const singleton = SAFE_SINGLETON;
        const saltNonce = initOpts.saltNonce;

        const gasLimit = calculateDeploymentGas(initOpts.owners);

        try {
            return this.factory.createProxyWithNonce(singleton, initializer, saltNonce, {
                gasLimit,
            });
        } catch (e) {
            throw new Error(`Error deploying the proxy: ${e}`);
        }
    }

    private async _calculateProxyAddress(saltNonce: number | BigNumber, initializer: string): Promise<Address> {
        const singleton = SAFE_SINGLETON;
        const to = SAFE_FACTORY;
        const data = encodeFunctionData(SafeFactory__factory.abi, "calculateCreateProxyWithNonceAddress", [
            singleton,
            initializer,
            saltNonce,
        ]);

        let address: Address;
        try {
            address = await this.provider.call({
                to,
                data,
            });
        } catch (e) {
            throw new Error(`Error calculating the address: ${e}`);
        }

        address = "0x" + address.slice(138, 178);
        return address;
    }
}
