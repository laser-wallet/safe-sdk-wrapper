import { ethers } from "ethers";

import type { Wallet } from "ethers";

import { SendTxOpts } from "../Safe";

// Signs a safe transaction.
export async function sign(signer: Wallet, hash: string): Promise<string> {
    const toSignHash = ethers.utils.arrayify(hash);
    const signature = (await signer.signMessage(toSignHash)).replace(/1b$/, "1f").replace(/1c$/, "20");
    return signature;
}

export function packOperation(tx1: SendTxOpts, tx2: SendTxOpts): SendTxOpts {
    if (tx1.signer.toLowerCase() === tx2.signer.toLowerCase()) {
        throw new Error("Duplicate signer.");
    }

    if (tx1.data.toLowerCase() !== tx2.data.toLowerCase()) {
        throw new Error("Calldata mismatch.");
    }

    if (tx1.value.toString() !== tx2.value.toString()) {
        throw new Error("Value mismatch.");
    }

    // etc ..
    let signatures: string;

    if (tx1.signer > tx2.signer) {
        signatures = tx2.signatures + tx1.signatures.slice(2);
    } else {
        signatures = tx1.signatures + tx2.signatures.slice(2);
    }

    tx1.signatures = signatures;
    return tx1;
}
