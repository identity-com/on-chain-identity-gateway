## Identity.com Gateway Tokens on Ethereum blockchain

This repository contains set of Ethereum smart contracts for Identity.com On-chain Identity Gateway token system. 

Gateway tokens allows Ethereum DeFi projects validate their users who succesfully completed KYC with regulations and guidances from FATF, US OFAC, US OCC BSA and others.


## Deploying the contracts and publishing the addresses

1. Prerequisites:

a) Ensure you have the following strings handy:
- Eth private key for the Gatekeeper Network Authority ( the one that signs adding new gatekeepers to the network. For e.g. the Zambezi network ).
Referred to as `gk_network_key` below.

b) If you're using infura ITX, ensure there's enough funds in the Infura gas tanks for both the Gatekeeper Network Authority and Gatekeeper Authority you're planning to use.

- Eth address of the Gatekeeper Authority ( the first Gatekeeper you want to add to the network after contract deployment ).
Referred to as `gk_authority_address` below.

- Infura project ID for use in the infura URL's .
Referred to as `infura_project_id` below.

2. `truffle compile` to build the contracts and generate the ABI.

3. Deploy the forwarder contract:
This example uses the Rinkeby network, but you can use any network defined in gateway-eth-ts [addresses.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/develop/ethereum/gateway-eth-ts/src/lib/addresses.ts) and [gatewayTokens.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/develop/ethereum/gateway-eth-ts/src/lib/gatewaytokens.ts) .

From the `smart-contract` directory:
```
PRIVATE_KEY="<gk_network_key>" INFURA_API_KEY="<infura_project_id>" yarn hardhat run --network rinkeby deploy/0_deploy_forwarder.js
```

Take note of the printed forwarder address, we'll need it below.

4. Open the hardhat task `<repo>/ethereum/smart-contract/deploy/1_deploy_gateway_token_controller.js` and make sure the following are correct:
```
let gkNetworkAuthorityAddr = "0xF32b1CAABFbaEe9173635433BCC9F43eD25d8Afc";
let gatekeeperAuthorityAddr = "0xcbaA8FDf9A9673850cf75E6E42B4eA1aDaA87688";
```  
The `gkNetworkAuthorityAddr` must be the public address for the GK network private key you're using from step 1.
The example above is for a network called Zambezi.

5. Deploy the token and token controller contracts:
```
PRIVATE_KEY="<gk_network_key>" INFURA_API_KEY="<infura_project_id>" yarn hardhat run --network rinkeby deploy/1_deploy_gateway_token_controller.js
```

If you get an error about not the flag storage transaction failing, it could be that the storage contract has already been deployed with the flags already set. Duplicate flags cannot be set.
In this case, try commenting out these lines:
```
console.log('Adding flags into flag storage...');
let tx = await (await flagsStorage.addFlags(flagCodes, indexArray, {from: deployer})).wait();
console.log("Added " + tx.events.length +  " flags into FlagsStorage with " + tx.gasUsed.toNumber() + " gas");
```

Take note of the deployed addresses for the Forwarder, GatewayToken and GatewayTokenController.

6. Update the following files with the deployed addresses printed by steps 3 and 5:
a) [addresses.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/develop/ethereum/gateway-eth-ts/src/lib/addresses.ts) :

- Make sure your Ethereum network has an entry in `export const addresses` with the correct chain id.
- Make sure the `<ETH_NETWORK>_ADDRESSES` constant reflects the new deployed contract addresses from steps 3 and 5.

b) [gatewaytokens.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/develop/ethereum/gateway-eth-ts/src/lib/gatewaytokens.ts) :

- Make sure your Ethereum network has an entry in `export const gatewayTokenAddresses` with the correct chain id.
- Make sure the `<ETH_NETWORK>_GATEWAY_TOKENS` constant reflects the new deployed GatewayToken contract address from step 5 .

## Deployed contracts

### Ropsten

[GatewayTokenController](https://ropsten.etherscan.io/address/0x560691424bCEF5ceF4D5076C8ACA7B38B7b1f9A0)

[FlagsStorage](https://ropsten.etherscan.io/address/0xC4ED3F939754f43555932AD2A2Ec1301d0848C07)

[GatewayToken](https://ropsten.etherscan.io/address/0xa3894BbA27f4Be571fFA319D02c122E021024cF2)

[Forwarder](https://ropsten.etherscan.io/address/0x79C2bDD404e629828E3702a5f2cdd01FD5De8808)

### Rinkeby

[GatewayTokenController](https://ropsten.etherscan.io/address/0x8769145499e1f97049e0099aF3d14283663C4Cf2)

[FlagsStorage](https://ropsten.etherscan.io/address/0xf85d72EF898EbF82Ac1d7597CBb68a4d2898cE46)

[GatewayToken](https://ropsten.etherscan.io/address/0x182ae55852ffE71CaCA87aF3CFa8b4eF895dd051)

[Forwarder](https://ropsten.etherscan.io/address/0x2AaA24BaC2a41050dBA2474d6D9C4eaa1cdf9159)


## Gateway Token system architecture

TODO

## Network participants

TODO

## Integration 
To integrate Gateway Tokens and validate user's identities DeFi contract has to import [IGatewayTokenVerifier](./contracts/IGatewayTokenVerifier.sol) interface. 

After importing IGatewayTokenVerifier interface you can trigger the function bellow:

```
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IGatewayTokenVerifier {
    /**
    * @dev Triggered by external contract to verify if `tokenId` and token `owner` are correct.
    *
    * Checks if token exists in gateway token contract, `tokenId` still active, and not expired.
    * Performs additional checks to verify that `owner` is not blacklisted globally.
    */
    function verifyToken(address owner, uint256 tokenId) external view returns (bool);

    /**
    * @dev Triggered by external contract to verify the validity of the default token for `owner`.
    *
    * Checks owner has any token on gateway token contract, `tokenId` still active, and not expired.
    * Performs additional checks to verify that `owner` is not blacklisted globally.
    */
    function verifyToken(address owner) external view returns (bool);
}
```

By sending user's tokenId and address as parameters system will validate if existing identity token is active and there is no KYC restrictions applied.

## Integration example 

In order to validate your user's gateway tokens validation smart contract first has to import a validation interface:

```import "./interfaces/IGatewayTokenVerifier.sol";```

After importing an interface a validation smart contract has to either specify a GatewayToken contract address for which type of tokens contract needs to validate for, or pass a token address during into the validation function. Typically there is two ways to validate user's tokens such as:

1) Validate specific token by tokenID

```
address gatekeeperNetwork;

function borrow(uint256 amount, uint256 tokenId) {
	IGatewayToken gt = IGatewayToken(gatekeeperNetwork);
	require(gt.verify(msg.sender, tokenid), "INVALID OR MISSING GATEWAY TOKEN");
	// transfer funds to msg.sender
}
```

2) Or validate a default token for user

```
address gatekeeperNetwork;

function borrow(uint256 amount) {
	IGatewayToken gt = IGatewayToken(gatekeeperNetwork);
	require(gt.verify(msg.sender), "INVALID OR MISSING GATEWAY TOKEN");
	// transfer funds to msg.sender
}
```


## Licence
This project is licensed under the MIT license, Copyright (c) 2021 Secured Finance. For more information see LICENSE.
