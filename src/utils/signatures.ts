import { ethers } from "ethers";

import type { Wallet } from "ethers";

// Signs a safe transaction.
export async function sign(signer: Wallet, hash: string): Promise<string> {
    const toSignHash = ethers.utils.arrayify(hash);
    const signature = (await signer.signMessage(toSignHash)).replace(/1b$/, "1f").replace(/1c$/, "20");
    return signature;
}
