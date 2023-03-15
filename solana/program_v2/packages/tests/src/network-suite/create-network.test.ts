import {
  AdminService,
  NetworkKeyFlags,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { expect } from 'chai';
import { describe } from 'mocha';
import { generateFundedKey } from '../util/lib';

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let service: AdminService;

  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;
  let authorityKeypair: Keypair;
  let guardianAuthority: anchor.Wallet;

  let networkAuthority: Keypair;

  beforeEach(async () => {
    authorityKeypair = await generateFundedKey();
    guardianAuthority = new anchor.Wallet(authorityKeypair);
    networkAuthority = Keypair.generate();

    service = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: guardianAuthority,
      },
      programProvider
    );
  });

  describe('Create Network', () => {
    it('Creates a network with default values', async () => {
      // Act
      await service.createNetwork().withPartialSigners(networkAuthority).rpc();
      const createdNetwork = await service.getNetworkAccount();

      // Assert
      expect(createdNetwork).to.not.be.null;
    }).timeout(10000);

    it('Creates a network with non-default values', async () => {
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
              flags: NetworkKeyFlags.AUTH,
              key: networkAuthority.publicKey,
            },
          ],
          supportedTokens: [],
          networkFeatures: 0,
        })
        .withPartialSigners(networkAuthority)
        .rpc();

      const createdNetwork = await service.getNetworkAccount();

      expect(createdNetwork?.passExpireTime).to.equal(400);
    }).timeout(10000);
  });
});
