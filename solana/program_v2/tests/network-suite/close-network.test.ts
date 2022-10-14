import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { AdminService } from '../../client/packages/core/src/AdminService';
import { GatewayV2 } from '../../target/types/gateway_v2';
import * as anchor from '@project-serum/anchor';
import { airdrop } from '../../client/packages/core/src/lib/utils';
import { expect } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let service: AdminService;
  let dataAccount: PublicKey;
  let authorityKeypair: Keypair;

  let authority;

  before(async () => {
    authorityKeypair = Keypair.generate();
    authority = new anchor.Wallet(authorityKeypair);
    // authority = programProvider.wallet;
    await airdrop(
      programProvider.connection,
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    // createNetworkAddress( authority pubkey, network index)
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

    await service.createNetwork().rpc();
  });

  describe('Close Network', () => {
    it('Should close network properly', async function () {
      let networkAccount = await service.getNetworkAccount();
      await service.closeNetwork().rpc();
      networkAccount = await service.getNetworkAccount();
      expect(networkAccount).to.be.null;
    }).timeout(10000);
    it("Shouldn't allow a random authority to close the network", async function () {
      let networkAccount = await service.getNetworkAccount();
      expect(
        service.closeNetwork(undefined, Keypair.generate().publicKey).rpc()
      ).to.be.eventually.rejected;
    });
  });
});
