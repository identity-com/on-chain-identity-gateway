import { AdminService, airdrop } from '@identity.com/gateway-solana-client';
import { GatewayV2 } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let service: AdminService;

  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;
  let authorityKeypair: Keypair;
  let authority: anchor.Wallet;

  let networkAuthority: Keypair;

  beforeEach(async () => {
    authorityKeypair = Keypair.generate();
    authority = new anchor.Wallet(authorityKeypair);
    networkAuthority = Keypair.generate();

    await airdrop(
      programProvider.connection,
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    service = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      'localnet',
      programProvider,
      authority
    );
  });

  describe('Create Network', () => {
    it('Creates a network with default values', async function () {
      await service.createNetwork().withPartialSigners(networkAuthority).rpc();

      const createdNetwork = await service.getNetworkAccount();

      expect(createdNetwork).to.not.be.null;
    }).timeout(10000);

    it('Creates a network with non-default values', async function () {
      await service
        .createNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: [
            {
              token: programProvider.wallet.publicKey,
              issue: 100,
              refresh: 100,
              expire: 100,
              verify: 100,
            },
          ],
          authKeys: [
            {
              flags: 1,
              key: networkAuthority.publicKey,
            },
          ],
          supportedTokens: [],
        })
        .withPartialSigners(networkAuthority)
        .rpc();

      const createdNetwork = await service.getNetworkAccount();

      expect(createdNetwork?.passExpireTime).to.equal(400);
    }).timeout(10000);
  });
});
