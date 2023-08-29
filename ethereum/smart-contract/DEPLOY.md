# Deploy to a new Contract

## Deploy the proxy contract at the correct addresses

1. Check out git commit `489e674b5d43f853761a6595e48eddcdaed774d1` (branch = `original-post-audit-evm-release`)
2. Run `yarn build`
3. In one terminal `yarn local-no-deploy` (`STAGE=prod hardhat node --no-deploy`)
4. In another terminal `yarn deploy localhost`
5. Check that the addresses match `constants.ts`

## Upgrade to the latest version

1. Check out git commit ``