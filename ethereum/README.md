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
- EIP712: [Typed data signing](https://eips.ethereum.org/EIPS/eip-712)
- EIP1822: [Universal Upgradeable Proxy Standard](https://eips.ethereum.org/EIPS/eip-1822)

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

### EIP-712: Typed data signing

In conjunction with the above standard for trusted forwarders and meta-transactions, the EIP-712 standard is used to
sign the payload transaction. 

The typed data standard specifies a method in which data to be signed (a transaction, in this case) is structured according
to a schema, which is agreed between the signer and verifier. While the primary motivation behind this standard is to
increase the security of user-facing wallets, by allowing them to display the data to be signed in a human-readable format,
it also has benefits for the gateway protocol.

One benefit is the Domain field, which in the gateway protocol
is set to the name and version of the trusted forwarder (FlexibleNonceForwarder).

This ensures that the signer of a meta-transaction is aware of the type and version of the forwarder that they are signing for.

Another example is that the signature of the function being called is shared between the signer and verifier, and encoded
into the message. This prevents attacks due to collisions between function signatures.

### EIP-1822: Universal Upgradeable Proxy Standard

The Gateway Protocol is upgradeable, using the EIP-1822 standard for Universal Upgradeable Proxies (UUPS). 

The decision to make the protocol upgradeable was made in order to allow the protocol to be improved over time, without
breaking existing gatekeeper networks and client smart contracts.

As the regulatory space around blockchain evolves, it is likely that the Gateway Protocol will need to be updated to
include new features, or to support new regulatory requirements. Furthermore, since the protocol is designed to be
a gateway to client smart contracts, any bug or security vulnerability in the protocol could potentially affect the
security of client smart contracts, and their ability to onboard users or comply with regulations.

Since these client smart contracts may not themselves be upgradeable, or be incapable of changing the address of the
gateway contract that they use, it is important that the gateway contract be upgradeable to ensure smooth operations
in any such scenario.

Therefore, the decision was made to allow upgradeability of the existing contract, rather than require all clients to
migrate to a new contract and require all gatekeepers to migrate to a new network.

Of the upgradeability standards available, the EIP-1822 (UUPS) standard was chosen for the following reasons:
- It includes the ability to disable upgradeability in the future, which may be taken for security reasons, or if the
  protocol is deemed to be sufficiently stable.
- Although it is not yet clear if it is used by significant contracts on Ethereum Mainnet, it is widely supported by the community
  and has been added to the OpenZeppelin SDK, which is used by the protocol.
- It is gas-efficient in comparison to some other standards

The upgrade key (the key used to upgrade the protocol) is set to an Identity.com key on deployment. It can be rotated by a
superadmin. The superadmin can also disable upgradeability.

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

