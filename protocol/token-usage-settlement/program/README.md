# Solana On-Chain Token Usage Settlement contract

This program defines all operations around tracking and settling gateway token usage from
various chains.

## Actors
The following actors are interacting with the Token Usage Settlement contract:

### The Token Usage Oracle.
An authoritative oracle that is able to publish accumulated token usage data onto 
one or more dedicated PDA account(s). 
Data is published onto an PDA account that is derived from
- Gatekeeper address
- dApp address
- Source Chain Contract address? (SOL-Mainnet, ETH ...)
uniquely identifying the open token usage positions
