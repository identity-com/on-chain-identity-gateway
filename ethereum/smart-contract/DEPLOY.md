# Deploy to a new Chain

Since the contract addresses are derived via Create2, the bytecode of the contract must be fixed to a particular version
in order to derive a standard address across all chains.

The code has undergone changes since the audit (to support later versions of solidity in client contracts, and similar
non-breaking changes), so to deploy while retaining the correct Create2 addresses:

`yarn deploy-preserve-contract-addresses <CHAIN>`
