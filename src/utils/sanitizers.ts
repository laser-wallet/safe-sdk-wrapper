import { utils } from "ethers";

import { Address } from "./hashing";

export function sanitizeAddress(address: Address): Address {
    return utils.getAddress(address);
}

export function sanitizeAddresses(addresses: Address[]): Address[] {
    const sanitizedAddresses: Address[] = [];

    addresses.map((address: Address) => {
        sanitizedAddresses.push(utils.getAddress(address));
    });

    return sanitizedAddresses;
}
