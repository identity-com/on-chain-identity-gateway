import { NetworkService } from '../../src/NetworkService';
import { AdminService } from '../../src/AdminService';
import { GatewayV2 } from '../../target/types/gateway_v2';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { airdrop, findProgramAddress } from '../../src/lib/utils';
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
  let adminDataAccount: PublicKey;
  let networkDataAccount: PublicKey;

  let adminAuthority: anchor.Wallet;
  let networkAuthority: anchor.Wallet;
  let adminAddress: PublicKey;

  before(async () => {
    // Creates both necessary authorities
    adminAuthority = new anchor.Wallet(Keypair.generate());
    networkAuthority = new anchor.Wallet(Keypair.generate());

    // airdrop to admin authority and network authority
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

    // Creates the address for both the network and gatekeeper
    [adminDataAccount] = await AdminService.createNetworkAddress(
      adminAuthority.publicKey
    );
    [networkDataAccount] = await NetworkService.createGatekeeperAddress(
      adminAuthority.publicKey,
      adminDataAccount
    );

    // creates the admin service with anchor
    adminService = await AdminService.buildFromAnchor(
      program,
      adminDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    // creates the network service with anchor
    networkService = await NetworkService.buildFromAnchor(
      program,
      networkDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    await adminService.createNetwork().rpc();
    await networkService.createGatekeeper(adminDataAccount).rpc();
  });
  describe('Close Gatekeeper', () => {
    it('Should close a gatekeeper properly', async function () {
      // runs closeGatekeeper
      await networkService.closeGatekeeper().rpc();
      // tries to request the gatekeeper account, which we expect to fail after closure
      expect(networkService.getGatekeeperAccount()).to.eventually.be.rejected;
    }).timeout(10000);
  });
});
