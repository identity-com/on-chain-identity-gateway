# Deploy to a new Contract

## Deploy the proxy contract at the correct addresses

1. Check out git commit `489e674b5d43f853761a6595e48eddcdaed774d1` (branch = `original-post-audit-evm-release`)
2. Run `yarn build`
3. In one terminal `yarn local-no-deploy` (`STAGE=prod hardhat node --no-deploy`)
4. In another terminal `yarn deploy localhost`
5. Check that the addresses match `constants.ts`
6. Deploy to the new chain `yarn deploy <chain>`

## Upgrade to the latest version

1. Check out git commit `b14606b8bebb85b4dd0f9354e312e298671db667` (branch = `fantom-post-charge-update`)
2. Run `yarn build`
3. Run `yarn upgrade-contract <chain>`
4. Deploy the forwarder `yarn deploy-forwarder <chain>`