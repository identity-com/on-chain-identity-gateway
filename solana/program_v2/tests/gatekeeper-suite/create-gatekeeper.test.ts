import { NetworkService } from '../../src/NetworkService';
import { AdminService } from '../../src/AdminService';
import { GatewayV2 } from '../../target/types/gateway_v2';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { airdrop, findProgramAddress } from '../../src/lib/utils';
import { expect } from 'chai';
import { describe } from 'mocha';
import { NetworkAccount } from '../../src/lib/types';

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
    adminAuthority = new anchor.Wallet(Keypair.generate());
    networkAuthority = new anchor.Wallet(Keypair.generate());

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

    [adminDataAccount] = await AdminService.createNetworkAddress(
      adminAuthority.publicKey
    );
    [networkDataAccount] = await NetworkService.createGatekeeperAddress(
      adminAuthority.publicKey
    );

    adminService = await AdminService.buildFromAnchor(
      program,
      adminDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      networkDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    await adminService.createNetwork().rpc();
  });
  describe('Create Gatekeeper', () => {
    it('Creates a gatekeeper w/ default data on an established network', async function () {
      // creates a gatekeeper with the admin's authority
      await networkService.createGatekeeper(adminAuthority.publicKey).rpc();
      // retrieves the gatekeeper
      let gatekeeperAccount = await networkService.getGatekeeperAccount();
      // tests to see if the requested gatekeeper's associated network equals the adminAuthority (or network) public key
      expect(gatekeeperAccount?.gatekeeperNetwork.toBase58()).to.equal(
        adminAuthority.publicKey.toBase58()
      );
    }).timeout(10000);
  });
});
