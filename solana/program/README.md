# Solana On-Chain Gateway Program

This program defines the operations that gatekeepers can perform on the Solana blockchain,
such as issuing and revoking gateway tokens, as well as operations to add/remove gatekeepers,
performed by gatekeeper network authorities.

## Instructions

The program provides the following instructions:

### 1. Add Gatekeeper

Callable by: Gatekeeper network authority

Input accounts:
- `[Writeable, Signer]` Payer
- `[Writeable]` Uninitialized gatekeeper account
- `[]` Gatekeeper authority
- `[Signer]` Gatekeeper network authority


### 2. Issue Gateway Token

Callable by: Gatekeeper

Input accounts:
- `[Writeable, Signer]` Payer
- `[Writeable]` Uninitialized gateway token account
- `[]` Owner wallet (TODO or DID)
- `[]` Gatekeeper account
- `[Signer]` Gatekeeper authority
- `[]` Gatekeeper network

Data:
- Expiry (TODO clock time, block, slot or epoch)
- Limits per currency (TODO optional)
- Metadata - e.g. jurisdiction code

Generates a new gateway token for a trader

### 3. Set Gateway Token state

Callable by: Gatekeeper
Input accounts:
- `[Writeable]` Gateway token account
- `[Signer]` Gatekeeper authority
- `[]` Gatekeeper account

Data:
- New state (Frozen, Revoked, Active)

Updates the state of a gateway token.
For details on the states, please see [Account Structures](#account-structures) below.

Frozen gateway tokens can be unfrozen by setting them to Active
Revoked tokens cannot be unrevoked.

### 4. Create Session   

Callable by: Gateway Token owner
Input accounts:
- `[Signer]` Payer
- `[]` Gateway token account
- `[Signer]` Owner wallet (TODO or DID)
- `[Writeable]` Uninitialised session token account
- `[Writeable]` Delegated CVC account


Data:
- Transaction Details (see [below](#transaction-details-structure))

Creates a short-lived (zero-rent) session token and pays the gatekeeper in CVC.

## Account Structures

### Gateway Token

- `features: Bitmap`    Feature flags that define the type of gateway token (see [below](#features))
- `owner_wallet: Pubkey`  The public key of the wallet to which this token was assigned
- `owner_identity: Option(Pubkey)`    The DID (must be on Solana) of the identity to which the token was assigned
- `gatekeeper_network: Pubkey`    The gateway network that issued the token
- `issuing_gatekeeper: Pubkey`    The specific gatekeeper that issued the token
- `state: [Active, Revoked, Frozen]`  The current state of the token (see [below](#gateway-token-state))
- `expiry: Option(UnixTimestamp)`   - The expiry time of the token as a unix timestamp  (i64) 
- `transaction_details: Option(TransactionDetailsStruct)` (see [below](#transaction-details-structure))

#### Features

The FeatureBitmap is an 8-bit unsigned integer where each bit represents a flag:

| Bit 	| Name              	| Description                                                                                                                         	|
|-----	|-------------------	|-------------------------------------------------------------------------------------------------------------------------------------	|
| 0   	| Session           	| The token is valid for the current transaction only. Must have its lamport balance set to 0.                                        	|
| 1   	| Expirable         	| The expiry field must be set and the expiry slot & epoch must not be in the past.                                                   	|
| 2   	| TransactionLinked 	| Expect a transaction-details struct, and check the contents against the details of the transaction that the token is being used for. 	|
| 3   	| IdentityLinked    	| Expect an owner-identity property, and check that a valid signer account for that identity.                                          	|
| 4   	| Custom        	    |                                                                                                                                     	|
| 5   	| Custom        	    |                                                                                                                                     	|
| 6   	| Custom        	    |                                                                                                                                     	|
| 7   	| Custom        	    |                                                                                                                                     	|

The final four bits are not defined by the protocol, but may be used by gatekeeper networks
to add custom features or restrictions to gateway tokens. For example, a gatekeeper network
may agree to set bit 4 when issuing a token to a user in the US, and programs may then choose
to accept or reject tokens based on that bit.

#### Gateway Token State

Tokens can be in the following states:
- Active
- Revoked
- Frozen

Only tokens in the "active" state are accepted by programs.

Tokens in the "revoked" state are invalid, and programs should take steps to remove any
open positions, orders etc that were issued with tokens that were later revoked
(see [below](#pruning-revoked-tokens) for more details).

Revoked tokens cannot be reactivated but must be reissued.

Tokens that are frozen are "paused" and new transactions should not
accept them. They may be frozen for a number of reasons, for example if
a user attempts to use a token while in a restricted jurisdiction, the
gatekeeper may freeze the token temporarily. Frozen/Unfrozen tokens can
be unfrozen by the issuing gatekeeper.

While not represented by a state on-chain, tokens may also have 'expired', in which
case, they are treated as frozen.

## Transaction Details Structure

Note - may of the details of this section are TBD

A TransactionDetails object encapsulates the details
of the operation being performed on the program
using the gateway.

For example, if the trader is using a dex, the
transactionDetails will contain the following fields:

- dex program ID
- market ID
- order size
- order direction
- order (base) currency

This transactionDetails object is encoded into the gateway session token, and checked
by the program using the gateway to ensure it matches the details of the transaction.

This ensures that gateway token costs can be based on the trade size,
as well as allowing limits etc.

## Pruning Revoked Tokens

TODO
