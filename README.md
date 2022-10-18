<p align="center">
  <img src="https://github.com/laser-wallet/laser-wallet-contracts/blob/master/docs/Logomark.png" width=280>
</p>

<br>

## SAFE-SDK-WRAPPER 

Super easy to use sdk to interact with a safe contract


### Deploy a new safe: 

```ts
import { Factory } from "...";

const signer = new ethers.Wallet("..");
const provider = new ethers.providers.JsonRpcProvider("https://...");

const factory = await Factory.create({ provider, signer });

const saltNonce = 1; 
const threshold = 2

const owners = ["0x...", "0x...", "0x.."];

// Calculates the address in advance.
const proxy = await factory.calculateProxyAddress({ owners, saltNonce, threshold });

// Deploys a safe. 
const tx = await factory.createProxy({ owners, saltNonce, threshold });
```




