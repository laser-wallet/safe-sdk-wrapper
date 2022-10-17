import { SafeSingleton } from "../typechain";

export type Address = string;
export type HashingOpts = {
    to: Address;
    value: bigint;
    data: string;
    safeTxGas: bigint;
    baseGas: bigint;
    gasPrice: bigint;
    gasToken: Address;
    refundReceiver: Address;
};

// Returns the transaction hash to be signed.
export async function getTxHash(wallet: SafeSingleton, opts: HashingOpts): Promise<string> {
    const { to, value, data, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver } = opts;
    // We don't accept delegatecalls.
    const operation = 0;
    const nonce = await wallet.nonce();

    try {
        return wallet.getTransactionHash(
            to,
            value,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            nonce
        );
    } catch (e) {
        throw new Error(`Error getting tx hash: ${e}`);
    }
}
