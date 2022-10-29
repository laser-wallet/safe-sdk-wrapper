<p align="center">
  <img src="https://github.com/laser-wallet/laser-wallet-contracts/blob/master/docs/Logomark.png" width=280>
</p>

<br>

## SAFE-SDK-WRAPPER 

Super easy to use sdk to interact with a safe contract


### Deploy a new safe: 

```ts
import { Factory } from "...";

const provider = new ethers.providers.JsonRpcProvider("https://...");

const factory = await Factory.create({ provider });

const saltNonce = 1; 
const threshold = 2

const owners = ["0x...", "0x...", "0x.."];

const opts = {
        owners,
        threshold,
        saltNonce,
};

const address = await factory.calculateProxyAddress(opts);

console.log("address ->", address);

```




