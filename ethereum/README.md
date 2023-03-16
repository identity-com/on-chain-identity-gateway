## EVM Gateway Protocol

## Summary

This document describes the Ethereum Virtual Machine (EVM) implementation of the Identity.com Gateway Protocol.

The Gateway Protocol is a standard that allows smart contracts to add access control constraints, requiring 
that a user has a valid Gateway Token (GT) in order to interact with the smart contract.

## Details

### Gateway Tokens

Gateway tokens are non-transferable, semi-fungible tokens that conform to the ERC-20 interface.
They are issued by "Gatekeepers", who are responsible for performing checks on the user to determine their
eligibility for a particular GT.

The gateway protocol is open and permissionless - anyone can become a gatekeeper and issue GTs. 
The strength of the model comes from the idea of a "Gatekeeper Network".

### The Gatekeeper Network

While anyone can be a gatekeeper, and issue tokens, they must do so in the context of a Gatekeeper Network.
A gatekeeper network is a group of gatekeepers that have agreed to work together to issue GTs for a particular
use-case.

For example, a Gateway Token indicating that the user is over 18 years of age may be issued by a number of different
gatekeepers. However, the client smart contract should not need to specify which gatekeeper it trusts to verify this claim.

Instead, gatekeepers unify under a Gatekeeper Network, and the client smart contract specifies that it trusts the
gatekeeper network. Gatekeeper networks are self-organising, and each has their own governance model.
Like the GTs themselves, anyone can create a new gatekeeper network, and determine the rules around how gatekeepers are
added to, and removed from, the network.

## Integration

The Gateway Protocol is designed to be integrated into existing smart contracts with minimal effort.
As mentioned above, the client smart contract specifies the Gatekeeper Network that it wishes to accept tokens from.
The client smart contract then calls the Gateway Protocol to verify that the user has a valid GT under that network.
If it does, the client smart contract can proceed with the transaction.

## Obtaining Gateway Tokens

The Gateway Protocol does not specify a mechanism by which users obtain GTs. This ascribes the most freedom to gatekeepers
and gatekeeper networks, allowing them to design their own user onboarding flows.

A common pattern is for a dApp to integrate an onboarding flow, in which they integrate with a specific gatekeeper on the 
client-side to execute the necessary steps required to obtain a GT. Another pattern is for the dApp to indicate that the user
must visit one of a set of gatekeepers to obtain a GT. A third pattern is for the dApp or protocol to themselves act as a
gatekeeper, and use the gateway protocol to issue a tokenised access pass to their users, after they have completed the
onboarding process required by the platform.

## Gateway Tokens and Soulbound Tokens

A Gateway Token is a form of Soulbound Token, in that it is bound to a specific user, and cannot be transferred to another.
In addition, GTs add features that give gatekeepers more control over the lifecycle of the token. In particular, GTs include
- expiry dates: GTs can be set to expire at a specific time, after which they will no longer be considered active, until refreshed by a gatekeeper
- freeze/unfreeze: GTs can be frozen by a gatekeeper, preventing them from being used until they are unfrozen. The conditions by which a GT is frozen and unfrozen are determined by the gatekeeper network.
- revoked: GTs can be revoked by a gatekeeper, permanently disabling them. The conditions by which a GT is revoked are determined by the gatekeeper network. Revocation differs from "burning" a token, in that it leaves a record on-chain. In fact, in the Gateway Protocol, GTs are not burnable by the holder. In this way, they can be used for "negative reputation" use-cases. 

## Standards

The Gateway Protocol is built on top of the following EVM standards:

- EIP20: [Fungible token](https://eips.ethereum.org/EIPS/eip-20)
- EIP3525: [Semi-fungible token](https://eips.ethereum.org/EIPS/eip-3525)
- EIP721: [Non-fungible token](https://eips.ethereum.org/EIPS/eip-721)
- EIP2771: [Meta transactions](https://eips.ethereum.org/EIPS/eip-2771)

### EIP-3525: Semi-fungible token

The Gateway Protocol uses semi-fungible tokens (SFTs) as the basis for Gateway Tokens (GTs).

Each GT is a non-transferrable SFT, where the "slot", or "type" is called a "Gatekeeper Network".

Gatekeeper networks and GT types are synonymous from the user's perspective, with "type" indicating
the type of claim or claims that are being made about the holder (e.g. "over 18", "unique human", "verified to use platform X"),
and "gatekeeper network" referring to the set of gatekeepers that are trusted to issue GTs of that type.

Although the standard refers 'fungibility', this should, in the context of GTs, refer to the fact that, unlike
NFTs, GTs are not unique. A user with one valid GT of a particular type is indistinguishable from a different
user with a valid GT of that type.

### EIP-721: Non-fungible token

Despite the above, the Gateway Protocol does implement the EIP-721 interface for GTs. This means that each token does
have a unique token ID, and can be uniquely frozen, revoked or have its expiry date changed. This allows gatekeepers
to control the lifecycle of each GT individually, while the EIP-3525 interface allows these tokens to be presented as
fungible to the client smart contract.

### EIP-2771: Meta transactions

While not a core part of the protocol, the Gateway Protocol includes support for meta-transactions using the EIP-2771 standard.

A meta-transaction is an on-chain transaction that contains a second transaction as its payload.

The meta-transaction is sent to a "trusted forwarder" contract, which is responsible for verifying that the internal transaction
is appropriately signed, and then executing the payload transaction, by sending it to the target contract.

The payload transaction is executed as if it were sent by the original signer. This allows the meta-transaction to be
signed and paid for by a third party, while still appearing in the target contract as if it were sent by the original signer.

In the gateway protocol case, all transactions are signed by a gatekeeper. So the meta-transaction pattern allows a gatekeeper
to send the transaction to the user, who can then sign and pay for it, without the gatekeeper needing to pay gas fees.

Furthermore, the repository includes a Flexible Nonce Forwarder, which, in the case where the transactions are sent
from the gatekeeper, allows gatekeepers to send transaction in parallel, without the need for them to wait for the previous
transaction to be confirmed.

## Glossary

- Gateway Token

A non-transferable token that indicates that a holder has a particular property or permission to gain access to a
particular smart-contract or set of smart-contracts.

- Gatekeeper

An issuer of Gateway Tokens, belongs to a gatekeeper network.

- Gatekeeper Network

A group of gatekeepers that have agreed to work together to issue GTs for a particular use-case. Gatekeeper networks
issue GTs of a particular type, and are responsible for verifying that the holder of a GT of that type has the 
property or permission that the GT indicates.

- Client Smart Contract

A smart contract that wishes to verify that a user has a valid GT before allowing them to execute a transaction.

