import {
  AdminService,
  airdrop,
  NetworkAccount,
  NetworkKeyFlags,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';
import { describe } from 'mocha';

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
    authorityKeypair = Keypair.generate();
    guardianAuthority = new anchor.Wallet(authorityKeypair);
    networkAuthority = Keypair.generate();

    await airdrop(
      programProvider.connection,
      guardianAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

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
      // Assemble
      const expectedAccountData: NetworkAccount = {
        version: 0,
        authority: guardianAuthority.publicKey,
        networkIndex: 0,
        authThreshold: 1,
        passExpireTime: 16,
        fees: [],
        authKeys: [{ flags: 4097, key: networkAuthority.publicKey }],
        networkFeatures: 0,
        supportedTokens: [],
        gatekeepers: [],
      };

      // Act
      await service.createNetwork().withPartialSigners(networkAuthority).rpc();

      const createdNetwork = await service.getNetworkAccount();

      // Assert
      expect(createdNetwork).to.deep.equal(expectedAccountData);
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
        })
        .withPartialSigners(networkAuthority)
        .rpc();

      const createdNetwork = await service.getNetworkAccount();

      expect(createdNetwork?.passExpireTime).to.equal(400);
    }).timeout(10000);
  });
});
