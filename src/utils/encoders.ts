import { BigNumber, ethers, utils } from "ethers";
import { SAFE_HANDLER } from "../constants";
import { SafeSingleton__factory } from "../typechain";
import { Address } from "./hashing";

// Gets the callData for a given function call with args.
export function encodeFunctionData(abi: any, fnName: string, ...params: any[]): string {
    params = params[0];
    return new ethers.utils.Interface(abi).encodeFunctionData(fnName, params);
}

export type InitOpts = {
    owners: Address[];
    threshold?: number; // Defaults to 2 for our default setup.
    payment?: BigNumber; // Amount to refund for the creation.
    paymentReceiver?: Address; // Address of the relayer.
};
// Returns the data to setup a safe.
export function getInitializer(opts: InitOpts): string {
    let { owners, threshold, payment, paymentReceiver } = opts;

    const ownersLength = owners.length;

    // @todo More arg checks.
    // - Check that owners are not duplicated.
    // - Check that the payment is in bounds.
    // etc.
    if (ownersLength < 3) {
        throw new Error(`There needs to be 3 owners but there are: ${ownersLength}`);
    }

    owners.forEach((owner: Address) => {
        if (!utils.isAddress(owner)) throw new Error(`Invalid address: ${owner}`);
    });

    threshold = threshold ? threshold : 2;
    if (threshold > ownersLength) {
        throw new Error(`Threshold too big. There are: ${ownersLength} owners and a threshold of: ${threshold}`);
    }

    const to = ethers.constants.AddressZero;
    const data = "0x";
    const fallbackHandler = SAFE_HANDLER;
    const paymentToken = ethers.constants.AddressZero; // We only accept ETH.
    payment = payment ? payment : BigNumber.from(0);
    paymentReceiver = paymentReceiver ? paymentReceiver : ethers.constants.AddressZero;

    const params = [owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver];
    return encodeFunctionData(SafeSingleton__factory.abi, "setup", params);
}
