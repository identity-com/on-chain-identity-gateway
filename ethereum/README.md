## Gateway Tokens on Ethereum

## Summary
This is a work-in-progress document, sketching out a proposed
[EIP](https://github.com/ethereum/EIPs) that defines a new
ERC standard for Gateway Tokens (GT).

Each gateway network is represented by a smart contract that
implements this ERC.
This differs from the [Solana](../solana) model,
where a single program governs gateway token issuance,
and a gateway network is defined by a public key.

## Definitions

An instance of a smart contract implementing this ERC is called a _Gateway_.

_Gatekeepers_ belong to one or more gateways, and are capable of issuing gateway
tokens for gateways they belong to. _Network Authorities_ define those who are
allowed to add and remove gatekeepers from gateways.

## Implementations

The various implementations of this ERC would differ only
in how the network authorities are defined.
For example, the simplest implementation would specify a key as the authority,
and only that key can add gatekeepers.
A more complicated implementation may allow gatekeepers to be added based on votes,
for example.

## ERC Definition
The ERC would define the following functions:

| Name                 	| Parameters                         	| Description                                                                  	| Callable by                                         	|
|----------------------	|------------------------------------	|------------------------------------------------------------------------------	|-----------------------------------------------------	|
| addGatekeeper        	| gatekeeperAddress, capabilities*** 	| Authorises a gatekeeper to issue GTs under this gateway                      	| Network authority (as defined by SC implementation) 	|
| removeGatekeeper     	| gatekeeperAddress                  	| Revokes a gatekeeper’s right to issue gateway tokens*                        	| Network authority (as defined by SC implementation) 	|
| listGatekeepers      	|                                    	| List all gatekeepers in the network and their capabilities***                	| All                                                 	|
| issueGatewayToken    	| walletAddress, expiry?             	| Issue a gateway token to a wallet                                            	| Gatekeepers                                         	|
| revokeGatewayToken   	| walletAddress                      	| Revoke a gateway token issued to a wallet, permanently disabling it.         	| Gatekeepers**                                       	|
| freezeGatewayToken   	| walletAddress                      	| Freeze an existing gateway token, preventing it from being used, temporarily 	| Gatekeepers**                                       	|
| unfreezeGatewayToken 	| walletAddress                      	| Unfreeze a frozen gateway token, reenabling it for use.                      	| Gatekeepers**                                       	|
| hasGatewayToken      	| walletAddress                      	| Check if a wallet has a valid gateway token                                  	| All                                                 	|

\* Should this render GTs issued by this gatekeeper void?

** Do gateway tokens need to be revoked by the same gatekeeper who issued them?
I suspect not, as this poses a risk if the gatekeeper disappears.

*** Gatekeeper Capabilities are TBD but are likely to be stored
off-chain and may relate to jurisdiction, KYC requirements, service endpoints etc.

## Integration with DeFi Contracts
We define a new integration library (analogous to the Solana [integration lib](../solana/integration-lib))
that DeFi smart contacts implement in order to verify the status of a gateway token.

Unlike the Solana implementation, traders do not need to provide their GT to the smart contract,
rather the smart contract, through this library, will make a call to the `hasGatewayToken`
function of the gateway program in order to check if the trader’s wallet address has a GT.

The DeFi smart contract must just provide the gateway smart contract address,
which is defined on deployment (some DeFi operators may also choose to make
it possible to update this after deployment).

## Identity-linked Gateway Tokens
TODO

## Cross-chain interoperability
TODO