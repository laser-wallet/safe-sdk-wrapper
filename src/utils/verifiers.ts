import { Address } from "./hashing";

export function verifyAddOwnerWithThreshold(owners: Address[], newOwner: Address, threshold: Number, signer: Address) {
    let isOwner = false;
    owners.map((owner: Address) => {
        if (owner.toLowerCase() === newOwner.toLowerCase()) {
            throw new Error("New owner is a current owner.");
        }
        if (owner.toLowerCase() === signer.toLowerCase()) isOwner = true;
    });

    if (threshold > owners.length + 1) {
        throw new Error("Threshold too big.");
    }
    if (threshold === 0) {
        throw new Error("Threshold cannot be 0.");
    }
}
