# Deploy to a new Chain

Since the contract addresses are derived via Create2, the bytecode of the contract must be fixed to a particular version
in order to derive a standard address across all chains.

The code has undergone changes since the audit (to support later versions of solidity in client contracts, and similar
non-breaking changes), so to obtain the correct Create2 address, the following steps must be taken:

## Deploy the proxy contract at the correct addresses

1. Run ``

1. Check out git tag
   [eth-deployment-step-1](https://github.com/identity-com/on-chain-identity-gateway/releases/tag/eth-deployment-step-1)
2. Delete `node_modules` directory (the initial build artifact, and therefore Create2 address, depends on a specific solidity version)
2. Run `yarn && yarn build`
3. In one terminal `yarn local-no-deploy` (`STAGE=prod hardhat node --no-deploy`)
4. In another terminal `yarn deploy localhost`
5. Check that the addresses match `constants.ts`
6. Deploy to the new chain `yarn deploy <chain>`

## Upgrade to the latest version

1. Check out git tag
   [eth-deployment-step-2](https://github.com/identity-com/on-chain-identity-gateway/releases/tag/eth-deployment-step-2)
2. Run `yarn build`
3. Run `yarn upgrade-contract <chain>`
4. Deploy the forwarder `yarn deploy-forwarder <chain>`
