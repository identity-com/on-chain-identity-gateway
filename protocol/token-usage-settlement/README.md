# Gateway Protocol - Token Usage Oracle

## Overview

The Token Usage Oracle of the Gateway Protocol is responsible for accumulating token usage
data from all smart-contract chains that have a Gateway Token Contract deployed. The data
will track all Gateway Token contract/program calls on the respective chain and accumulate
all events with a pre-specified timeframe (proposal 1 week) and an oracle will republish
the data onto the Gateway Protocol Governance Chain (Solana) in an accumulated fashion.
Correct accumulation can be verified externally by verifying the accumulated data in regard
to the source chain.

### Persisting Usage Data

The governance chain (Solana) persist the token usage data with the help of an oracle.
The data is accumulated  and stored with an identifiable block-height/epoch in order 
to prevent double-counting.

### Rolling Buffer
- Talk about a rolling average of x-times for the last x-sync periods.

### Exchange Fees
- 


