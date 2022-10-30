import { Safe, SendTxOpts } from "../Safe";

import { BigNumber, ethers } from "ethers";
import { packOperation } from "../utils";

const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/faf17ca58524494b98040c2047b5465a");

const walletAddress = "0xDF1d1370A694FA0B0048b70eA97619e0d86aa4F0";

async function viewSafe() {
    const owner = new ethers.Wallet("");
    const safe = new Safe(provider, owner, walletAddress);
    await safe.init();

    const owners = await safe.getOwners();
    console.log("owners ->", owners);

    const threshold = await safe.getThreshold();
    console.log("threshold ->", threshold);

    const nonce = await safe.getNonce();
    console.log("nonce ->", nonce);

    const singleton = await safe.getSingleton();
    console.log("singleton ->", singleton);
}

/**
 *   Operation to send eth.
 */
const owner = new ethers.Wallet("");
const guardian = new ethers.Wallet("");
const to = ethers.Wallet.createRandom().address;
const value = "0.0001";
const data = "0x";
const gasLimit = 100000;
const relayer = owner.address;

/// The signature of the owner.
async function ownerSign(): Promise<SendTxOpts> {
    const ownerSafe = new Safe(provider, owner, walletAddress);
    await ownerSafe.init();
    const tx = await ownerSafe.sendEth(to, value, { gasLimit, relayer });
    console.log(tx);
    return tx;
}

/// The signature of the guardian.
async function guardianSign(): Promise<SendTxOpts> {
    const guardianSafe = new Safe(provider, guardian, walletAddress);
    const tx2 = await guardianSafe.sendEth(to, value, { gasLimit, relayer });
    console.log(tx2);
    return tx2;
}

/// We send the transaction without a relayer.
// async function sendTransaction() {
//     const ownerTx = await ownerSign();
//     console.log("owner tx ->", ownerTx);

//     const guardianTx = await guardianSign();
//     console.log("guardian tx ->", guardianTx);

//     // Returns duplicate signer ??
//     const transaction = packOperation(ownerTx, guardianTx);
// }

async function sendTransaction() {
    const ownerSafe = new Safe(provider, owner, walletAddress);

    const tx1: SendTxOpts = {
        signer: "0x11a9E352394aDD8596594422A6d8ceA59B73aF0e",
        to: "0x06E5250dFf75ACA538a10e66357748d2889528bA",
        value: BigNumber.from("0x5af3107a4000"),
        data: "0x",
        operation: 0,
        safeTxGas: BigNumber.from("0x0186a0"),
        baseGas: BigNumber.from("0x7530"),
        gasPrice: BigNumber.from("0x056bc75e2d63100000"),
        gasToken: "0x0000000000000000000000000000000000000000",
        refundReceiver: "0xcC9d02aBe5487dd64A890bBfFd0b05cF7901043c",
        signatures:
            "0x62fc55122adf2d2e12604d5563c7bf5bba3487a7d720caa043a6026208dd20165244b10fc2aa67e7ba84db76b0e3d2b28cbc5a36be821a3272c78d88656fcea920",
    };

    const tx2: SendTxOpts = {
        signer: "0xcC9d02aBe5487dd64A890bBfFd0b05cF7901043c",
        to: "0x06E5250dFf75ACA538a10e66357748d2889528bA",
        value: BigNumber.from("0x5af3107a4000"),
        data: "0x",
        operation: 0,
        safeTxGas: BigNumber.from("0x0186a0"),
        baseGas: BigNumber.from("0x7530"),
        gasPrice: BigNumber.from("0x056bc75e2d63100000"),
        gasToken: "0x0000000000000000000000000000000000000000",
        refundReceiver: "0xcC9d02aBe5487dd64A890bBfFd0b05cF7901043c",
        signatures:
            "0x991154c355192e21451027db86c7409c2d0386930dabbfb07eed0f2758ff3fdd7e134e6d91b6604c619c81890b63ceb76081891efef0aafbceb77da24e352bfb20",
    };

    // We pack the transaction
    const transaction = packOperation(tx2, tx1);

    // We send the transaction
    await ownerSafe.sendTransaction(transaction);
}
