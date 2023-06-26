## Identity.com Gateway Tokens on Ethereum blockchain

This repository contains set of Ethereum smart contracts for Identity.com On-chain Identity Gateway token system.

Gateway tokens allows Ethereum DeFi projects to validate that their users successfully completed KYC, with regulations
and guidances from FATF, US OFAC, US OCC BSA and others.

## Quick Start

1. Use established node version by running `nvm use`
2. Install repository dependencies by running `yarn install`
3. Run `yarn build` to compile smart contracts
4. Execute `yarn test` to run the tests.

### Static analysis

Additionally, you can perform static analysis for well-known code issues and vulnerabilities using
[Slither](https://github.com/crytic/slither#slither-the-solidity-source-analyzer).

```
pip3 install slither-analyzer
yarn analyze
```

## Environment variables

Please refer to `.env.example` and create `.env` to provide secret info such as private keys, Infura ID. Private keys
are used in order to deploy smart contracts on one of the Ethereum networks.

## Compile

To compile smart contracts, type `hardhat compile`. Use `--force` option to recompile everything if needed.

The compiled output is a json file called Artifacts and saved in `./build/contracts` directory per contract basis. ABI
and bytecode associated with the smart contract will be saved in the json file.

## Deployment

In order to deploy the protocol please execute `yarn deploy <NETWORK>` command and replace with the network you want to
deploy the protocol.

For example `yarn deploy hardhat` will deploy the protocol on the local hardhat version of the ethereum blockchain.

After the successful deployment you'll be able to find the deployment result in the `deployments` folder.

## Integration

To integrate Gateway in your smart contract:

First, import the contract dependencies:

```
npm install @identity.com/gateway-protocol-eth
```

Then, in your smart contract, inherit the `Gated` contract, and add the `gated` modifier to any function.

The function can only be called by a `msg.sender` that has a valid gateway token.

```solidity
import '@identity.com/gateway-protocol-eth/contracts/Gated.sol';

// Your contract
contract MyContract is Gated {
  constructor(address gatewayTokenContract, uint256 gatekeeperNetwork) Gated(gatewayTokenContract, gatekeeperNetwork) {}

  function myFunction() external gated {}
}
```

If you want more control over the verification process on-chain, you can use the following code instead of the Gated
contract:

```solidity
import "@identity.com/gateway-protocol-eth/contracts/interfaces/IGatewayTokenVerifier.sol";

...
IGatewayTokenVerifier verifier = IGatewayTokenVerifier(gatewayTokenContract);
if (!verifier.verifyToken(addressToVerify, gatekeeperNetwork)) {
// some logic
}
```

## Creating a Gatekeeper Network

This section describes how to create a Gatekeeper Network (GKN) and add Gatekeepers to it. It uses
[ethers](https//docs.ethers.org) to interact with the smart contracts.

```ts
// check slot ID availability
const slotId = ...; // select a slot ID
const network = await gatewayToken.getNetwork(slotId);

// create a gatekeeper network, owned by the wallet (the wallet is the network authority)
await gatewayToken.connect(wallet).createNetwork(slotId, 'My Gatekeeper Network', false, ZERO_ADDRESS);

// create a gatekeeper network, owned by a DAO
await gatewayToken.connect(wallet).createNetwork(slotId, 'My Gatekeeper Network', true, DAO_ADDRESS);
```

### Adding a Gatekeeper to the GKN

```ts
// add a gatekeeper to the network
await gatewayToken.connect(wallet).addGatekeeper(gatekeeperAddress, slotId);
```

### Setting a network feature

Only one network feature is available:

- `removeGatekeeperInvalidatesTokensFeature` - if set, removing a gatekeeper from the network will invalidate all
  gateway tokens issued by the network.

```ts
const removeGatekeeperInvalidatesTokensFeature = 0;
const mask = 1 << removeGatekeeperInvalidatesTokensFeature;

// will be false
await gatewayToken.networkHasFeature(slotId, removeGatekeeperInvalidatesTokensFeature);

await gatewayToken.connect(identityCom).setNetworkFeatures(slotId, mask);

// will be true
await gatewayToken.networkHasFeature(slotId, removeGatekeeperInvalidatesTokensFeature);
```
