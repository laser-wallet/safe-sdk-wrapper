import { ethers } from "ethers";

export const SAFE_FACTORY = "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2";

export const SAFE_SINGLETON = "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552";

export const SAFE_HANDLER = "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4";

export const SUPPORTED_CHAINS = ["mainnet", "goerli"];

/**
 *
 * If the GAS_TOKEN is address(0), then the currency is ETH.
 * We are only accepting ETH for now.
 *
 */
export const GAS_TOKEN = ethers.constants.AddressZero;

/**
 *
 * The gas price will always be 'tx.gasprice'.
 * We set 'GAS_PRICE' to a big amount so it will always default to 'tx.gasprice'.
 *
 * Contract code:
 * ** payment = gasUsed.add(baseGas).mul(gasPrice < tx.gasprice ? gasPrice : tx.gasprice); **
 * url: https://github.com/safe-global/safe-contracts/blob/main/contracts/GnosisSafe.sol#L207
 *
 */
export const GAS_PRICE = ethers.utils.parseEther("100");

/**
 *
 * Supported safe functions by Laser.
 *
 */
export const SAFE_FUNCTIONS = {
    addOwnerWithThreshold: "addOwnerWithThreshold",
    removeOwner: "removeOwner",
    changeThreshold: "changeThreshold",
};
