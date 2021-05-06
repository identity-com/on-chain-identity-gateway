# Solana On-Chain Gateway Program

This program defines the operations that gatekeepers can perform on the Solana blockchain,
such as issuing and revoking gateway tokens.

## Instructions

The program provides the following instructions:

### 1. Issue Gateway Token

Callable by: Gatekeeper

Input accounts:
- [Writeable] Uninitialized gateway token account
- [Signer] Gatekeeper account
- [] Owner wallet (TODO or DID)
- [Signer] Payer

Data:
- Expiry (TODO clock time, block, slot or epoch)
- Limits per currency (TODO optional)
- Metadata - e.g. jurisdiction code

Generates a new gateway token for a trader

### 2. Set Gateway Token state

Callable by: Gatekeeper
Input accounts:
- [Writeable] Gateway token account
- [Signer] Gatekeeper account
- [Signer] Payer

Data:
- New state (Frozen, Revoked, Active)

Updates the state of a gateway token.
For details on the states, please see [Account Structures](#account-structures) below.

Frozen gateway tokens can be unfrozen by setting them to Active
Revoked tokens cannot be unrevoked.

### 3. Create Session   

Callable by: Gateway Token owner
Input accounts:
- [] Gateway token account
- [Signer] Owner wallet (TODO or DID)
- [Writeable] Uninitialised session token account
- [Writeable] Delegated CVC account
- [Signer] Payer

Data:
- Transaction Details (see [below](#transaction-details-structure))

Creates a short-lived (zero-rent) session token and pays the gatekeeper in CVC.

## Account Structures

### Gateway Token

- Owner: Pubkey
- Gatekeeper: Pubkey
- State: [Active, Revoked, Frozen]
- Expiry: [u64;2]   - Epoch - Slot

### Gateway Session Token

- Owner: Pubkey
- Gatekeeper: Pubkey
- TransactionDetails: TransactionDetailsStruct (see [below](#transaction-details-structure))

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