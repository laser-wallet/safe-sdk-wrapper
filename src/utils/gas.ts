import { Address } from "./hashing";
import { ethers } from "ethers";

/// Calculates the deployment cost in units of gas.
/// It is not 100% accurate and it returns the number with a buffer.
export function calculateDeploymentGas(owners: Address[]): number {
    const ownersLength = owners.length;

    const baseCost = 270_000; // 1 owner + buffer.
    const extraOwner = 25_000; // + buffer.

    return ownersLength === 1 ? baseCost : baseCost + extraOwner * (ownersLength - 1);
}
