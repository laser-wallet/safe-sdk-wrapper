import type { Provider } from "@ethersproject/providers";
import { BigNumber, providers, Wallet, Signer } from "ethers";
import { SAFE_SINGLETON, SAFE_FACTORY, SUPPORTED_CHAINS } from "./constants";
import { Address, encodeFunctionData, getInitializer, InitOpts } from "./utils";
import { SafeFactory, SafeFactory__factory } from "./typechain";
import { calculateDeploymentGas } from "./utils/gas";

/// Factory that deploys safe contracts.
export class Factory {
    public factory: SafeFactory;

    /// Creates a new Factory class.
    static async create(provider: Provider): Promise<Factory> {
        let networkName: string = (await provider.getNetwork()).name;
        networkName = networkName === "homestead" ? "mainnet" : networkName;

        if (!SUPPORTED_CHAINS.includes(networkName)) {
            throw new Error(`Unsupported chain: ${networkName}`);
        }

        const factory = new this(provider);
        return factory;
    }

    protected constructor(public provider: Provider) {
        this.factory = SafeFactory__factory.connect(SAFE_FACTORY, this.provider);
    }

    public getInitializer(opts: InitOpts): string {
        return getInitializer(opts);
    }

    /// Calculates how much gas it cost to deploy a safe
    /// given the owners.
    public calculateDeploymentGas(owners: Address[]): number {
        return calculateDeploymentGas(owners);
    }

    /// Calculates the proxy (safe) address in advance.
    public async calculateProxyAddress(initOpts: InitOpts, saltNonce: BigNumber | number): Promise<Address> {
        const initializer = getInitializer(initOpts);
        return this._calculateProxyAddress(saltNonce, initializer);
    }

    /// Directly creates a safe.
    public async deployProxy(initializer: string, saltNonce: number, signer: Wallet): Promise<Address> {
        signer = signer.connect(this.provider);

        const preComputedAddress = await this._calculateProxyAddress(saltNonce, initializer);

        try {
            await this.factory.connect(signer).createProxyWithNonce(SAFE_SINGLETON, initializer, saltNonce);
            return preComputedAddress;
        } catch (e) {
            throw new Error(`Error deploying the safe: ${e}`);
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
