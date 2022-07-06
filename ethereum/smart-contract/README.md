## Identity.com Gateway Tokens on Ethereum blockchain

This repository contains set of Ethereum smart contracts for Identity.com On-chain Identity Gateway token system.

Gateway tokens allows Ethereum DeFi projects to validate that their users successfully completed KYC,
with regulations and guidances from FATF, US OFAC, US OCC BSA and others.

## Quick Start

1. Use established node version by running `nvm use`
2. Install repository dependencies by running `yarn install`
3. Run `yarn build` to compile smart contracts
4. Execute `yarn test` to run the tests.

## Environment variables

Please refer to `.env.example` and create `.env` to provide secret info such as private keys, Infura ID.
Private keys are used in order to deploy smart contracts on one of the Ethereum networks.

## Compile

To compile smart contracts, type `hardhat compile`. Use `--force` option to recompile everything if needed.

The compiled output is a json file called Artifacts and saved in `./build/contracts` directory per contract basis.
ABI and bytecode associated with the smart contract will be saved in the json file.

## Deployment

In order to deploy the protocol please execute `yarn deploy <NETWORK>` command and replace with the network you want to deploy the protocol.

For example `yarn deploy hardhat` will deploy the protocol on the local hardhat version of the ethereum blockchain.

After the successful deployment you'll be able to find the deployment result in the `deployments` folder.

## Integration

To integrate Gateway Tokens and validate user's identities DeFi contract has to import [IGatewayTokenVerifier](./contracts/IGatewayTokenVerifier.sol) interface.

After importing IGatewayTokenVerifier interface, you can trigger the function below:

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

By sending a user's address and optionally, token ID, as parameters,
the system will validate if their gateway token is active.

## Integration example

In order to validate your user's gateway tokens validation smart contract first has to import a validation interface:

`import "./interfaces/IGatewayTokenVerifier.sol";`

After importing an interface a validation smart contract has to either specify a GatewayToken contract address for which type of tokens contract needs to validate for, or pass a token address during into the validation function. Typically there is two ways to validate user's tokens such as:

1. Validate specific token by tokenID

```
address gatekeeperNetwork;

function borrow(uint256 amount, uint256 tokenId) {
	IGatewayToken gt = IGatewayToken(gatekeeperNetwork);
	require(gt.verify(msg.sender, tokenid), "INVALID OR MISSING GATEWAY TOKEN");
	// transfer funds to msg.sender
}
```

2. Or validate a default token for user

```
address gatekeeperNetwork;

function borrow(uint256 amount) {
	IGatewayToken gt = IGatewayToken(gatekeeperNetwork);
	require(gt.verify(msg.sender), "INVALID OR MISSING GATEWAY TOKEN");
	// transfer funds to msg.sender
}
```

## Creating a GKN

...

### Adding a Gatekeeper to the GKN
