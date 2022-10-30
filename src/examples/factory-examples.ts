import { Factory } from "../Factory";

import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/faf17ca58524494b98040c2047b5465a");

const owner1 = ethers.Wallet.createRandom().address;
const owner2 = ethers.Wallet.createRandom().address;
const owner3 = ethers.Wallet.createRandom().address;

const saltNonce = 1111;

/// Gets the initializer.
async function getInitializer() {
    // We create the factory.
    const factory = await Factory.create(provider);

    const opts = {
        owners: [owner1, owner2, owner3],
    };

    const initializer = factory.getInitializer(opts);

    console.log("initializer ->", initializer);
}

/// Calculates the address in advance.
async function calculateAddress() {
    const factory = await Factory.create(provider);

    const opts = {
        owners: [owner1, owner2, owner3],
    };

    const address = await factory.calculateProxyAddress(opts, saltNonce);

    console.log("address ->", address);
}

/// Calculates the amount of gas required to deploy a Safe.
async function calculateGas() {
    const factory = await Factory.create(provider);

    const opts = {
        owners: [owner1, owner2, owner3],
    };

    const gas = factory.calculateDeploymentGas(opts.owners);

    console.log("gas ->", gas);
}

/// Directly deploys a new proxy without a relayer.
async function deploy() {
    const factory = await Factory.create(provider);

    const owner = new ethers.Wallet("");
    const guardian = new ethers.Wallet("");
    const recoveryOwner = new ethers.Wallet("");

    const opts = {
        owners: [owner.address, guardian.address, recoveryOwner.address],
    };

    const initializer = factory.getInitializer(opts);
    const saltNonce = 1234;

    const res = await factory.deployProxy(initializer, saltNonce, owner);

    console.log("proxy ->", res);
}
