## Civic Gateway Tokens on Ethereum blockchain

This repository contains set of Ethereum smart contracts for Identity.com On-chain Identity Gateway token system. 

Gateway tokens allows Ethereum DeFi projects validate their users who succesfully compleded KYC on Civic Wallet with regulations and guidances from FATF, US OFAC, US OCC BSA and others.

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
    function verifyToken(uint256 tokenId, address owner) external view returns (bool);
}
```

By sending user's tokenId and address as parameters system will validate if existing identity token is active and there is no KYC restrictions applied.

## Integration example 

TODO


## Licence
This project is licensed under the MIT license, Copyright (c) 2021 Secured Finance. For more information see LICENSE.
