import {
  NetworkService,
  AdminService,
  airdrop,
} from '@identity.com/gateway-solana-client';
import { GatewayV2 } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let adminService: AdminService;
  let networkService: NetworkService;
  let gatekeeperDataAccount: PublicKey;
  let stakingDataAccount: PublicKey;

  let adminAuthority: anchor.Wallet;
  let networkAuthority: Keypair;

  before(async () => {
    adminAuthority = new anchor.Wallet(Keypair.generate());
    networkAuthority = Keypair.generate();

    //network airdrop
    await airdrop(
      programProvider.connection,
      adminAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      networkAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    [gatekeeperDataAccount] = await NetworkService.createGatekeeperAddress(
      adminAuthority.publicKey,
      networkAuthority.publicKey
    );
    [stakingDataAccount] = await NetworkService.createStakingAddress(
      networkAuthority.publicKey
    );

    adminService = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      'localnet',
      programProvider,
      adminAuthority
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      adminAuthority.publicKey,
      gatekeeperDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    await adminService
      .createNetwork()
      .withPartialSigners(networkAuthority)
      .rpc();

    await networkService
      .createGatekeeper(networkAuthority.publicKey, stakingDataAccount)
      .rpc();
  });

  describe('Close Gatekeeper', () => {
    it('Should close a gatekeeper properly', async function () {
      // runs closeGatekeeper
      await networkService.closeGatekeeper(networkAuthority.publicKey).rpc();
      // tries to request the gatekeeper account, which we expect to fail after closure
      expect(networkService.getGatekeeperAccount()).to.eventually.be.rejected;
    }).timeout(10000);
  });
});
