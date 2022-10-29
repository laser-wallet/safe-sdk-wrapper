import { Factory } from "../Factory";

import { ethers } from "ethers";

const provider = ethers.providers.getDefaultProvider();

const owner1 = ethers.Wallet.createRandom().address;
const owner2 = ethers.Wallet.createRandom().address;
const owner3 = ethers.Wallet.createRandom().address;

const saltNonce = 1111;

async function getInitializer() {
    // We create the factory.
    const factory = await Factory.create(provider);

    const opts = {
        owners: [owner1, owner2, owner3],
        saltNonce,
    };

    const initializer = factory.getInitializer(opts);

    console.log("initializer ->", initializer);
}

/// Calculates the address in advance.
async function calculateAddress() {
    const factory = await Factory.create(provider);

    const opts = {
        owners: [owner1, owner2, owner3],
        saltNonce,
    };

    const address = await factory.calculateProxyAddress(opts);

    console.log("address ->", address);
}
