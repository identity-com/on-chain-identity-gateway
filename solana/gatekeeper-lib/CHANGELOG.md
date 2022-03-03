# **Changelog: solana-gatekeeper-lib 4.0.1-beta-2**

## Simpler interfaces for _GatekeeperService_ and _GatekeeperNetworkService_

- ### _GatekeeperService_ and _GatekeeperNetworkService_ now have simpler versions accessible with _SimpleGateekeeperService_ and _SimpleGatekeeperNetworkService_  
- ### The new interfaces offer functions that simplify the output of those in the original interfaces by sending and confirming the results of the original functions

## Removed _serializeForRelaying_ and related functions

- ### _Transaction.serialize_ works in newer web3 versions, so there was no need to retain _serializeForRelaying_
