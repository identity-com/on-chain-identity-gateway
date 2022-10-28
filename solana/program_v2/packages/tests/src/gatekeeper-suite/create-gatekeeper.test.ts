import {
  NetworkService,
  AdminService,
  airdrop,
} from '@identity.com/gateway-solana-client';
import { GatewayV2 } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let adminService: AdminService;
  let networkService: NetworkService;
  let gatekeeperDataAccount: PublicKey;
  let stakingDataAccount: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;

  before(async () => {
    adminAuthority = Keypair.generate();
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
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(adminAuthority),
      },
      programProvider
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      adminAuthority.publicKey,
      gatekeeperDataAccount,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(adminAuthority),
      },
      programProvider
    );

    await adminService
      .createNetwork()
      .withPartialSigners(networkAuthority)
      .rpc();
  });

  describe('Create Gatekeeper', () => {
    it('Creates a gatekeeper w/ default data on an established network', async function () {
      // creates a gatekeeper with the admin's authority
      await networkService
        .createGatekeeper(
          networkAuthority.publicKey,
          stakingDataAccount,
          adminAuthority.publicKey
        )
        .withPartialSigners(adminAuthority)
        .rpc();

      // retrieves the gatekeeper
      const gatekeeperAccount = await networkService.getGatekeeperAccount();
      // tests to see if the requested gatekeeper's associated network equals the adminAuthority (or network) public key
      expect(gatekeeperAccount?.gatekeeperNetwork.toBase58()).to.equal(
        networkAuthority.publicKey.toBase58()
      );

      const network = await adminService.getNetworkAccount();
      expect(network?.gatekeepers.length).to.equal(1);
    }).timeout(10000);
  });
});
