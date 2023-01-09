# gateway-eth-ts

[![Version](https://img.shields.io/npm/v/gateway-eth-ts.svg)](https://www.npmjs.com/package/@identity.com/gateway-eth-ts)
[![Downloads/week](https://img.shields.io/npm/dw/gateway-eth-ts.svg)](https://www.npmjs.com/package/@identity.com/gateway-eth-ts)
[![License](https://img.shields.io/npm/l/gateway-eth-ts.svg)](https://github.com/identity-com/on-chain-identity-gateway/blob/main/ethereum/gateway-eth-ts/package.json)

# Gateway ETH TS library

This client library allows JS/TS applications to communicate with Gateway token system on Ethereum blockchain.
Common methods include validation of existing tokens, new gateway token issuance, token freezing/unfreezing and revocation.

## Installation

`yarn add @identity.com/gateway-eth-ts`

## Metamask integration example

```
import {
  GatewayTs,
} from "@identity.com/gateway-eth-ts";
import {
  getDefaultProvider,
  Wallet,
  providers
} = from 'ethers';
import { useWallet } from 'use-wallet';


(async function() {
  const { ethereum } = useWallet();
  const chainId = Number(ethereum.chainId);
  const provider = new ethers.providers.Web3Provider(
      ethereum,
      chainId
  );
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const gateway = new GatewayTs(gatekeeper, network, DEFAULT_GATEWAY_TOKEN_ADDRESS);
  const testUser = '0xD42Ef952F2EA1E77a8b771884f15Bf20e35cF85f';
  await (await gateway.issue(testUser)).wait();
})();
```

## Utility functions


### Token bitmask construction

The easiest way to associate certain flags with the gateway token is by using list of supported KYC flags, and `addFlagsToBitmask` function.

```
  flags = [KYCFlags.IDCOM_1];
  bitmask = addFlagsToBitmask(bitmask, flags);
```
