## Identity.com Gateway Tokens on Ethereum blockchain

This repository contains set of Ethereum smart contracts for Identity.com On-chain Identity Gateway token system. 

Gateway tokens allows Ethereum DeFi projects validate their users who succesfully completed KYC with regulations and guidances from FATF, US OFAC, US OCC BSA and others.

## Deployed contracts

[GatewayTokenController](https://ropsten.etherscan.io/address/0x560691424bCEF5ceF4D5076C8ACA7B38B7b1f9A0)

[FlagsStorage](https://ropsten.etherscan.io/address/0xC4ED3F939754f43555932AD2A2Ec1301d0848C07)

[GatewayToken](https://ropsten.etherscan.io/address/0xa3894BbA27f4Be571fFA319D02c122E021024cF2)

[Forwarder](https://ropsten.etherscan.io/address/0x79C2bDD404e629828E3702a5f2cdd01FD5De8808)

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
