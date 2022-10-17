import { AdminService } from '@identity.com/gateway_v2-client/src/AdminService';
import { GatewayV2, IDL } from '@identity.com/gateway_v2-idl/src/gateway_v2';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { airdrop } from '@identity.com/gateway_v2-client/src/lib/utils';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let service: AdminService;

  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let dataAccount: PublicKey;

  beforeEach(async () => {
    const authority = new anchor.Wallet(Keypair.generate());
    await airdrop(
      programProvider.connection,
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    [dataAccount] = await AdminService.createNetworkAddress(
      authority.publicKey,
      0
    );

    service = await AdminService.buildFromAnchor(
      program,
      dataAccount,
      'localnet',
      programProvider,
      authority
    );
  });
  describe('Create Network', () => {
    it('Creates a network with default values', async function () {
      await service.createNetwork().rpc();

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
              key: programProvider.wallet.publicKey,
            },
          ],
          networkIndex: 0, // TODO: This should probably not be part of the network data
          supportedTokens: [],
          gatekeepers: [],
        })
        .rpc();

      const createdNetwork = await service.getNetworkAccount();

      expect(createdNetwork?.passExpireTime).to.equal(400);
    }).timeout(10000);
  });
});
