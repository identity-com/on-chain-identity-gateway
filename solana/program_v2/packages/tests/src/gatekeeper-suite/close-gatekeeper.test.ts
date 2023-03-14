import {
  NetworkService,
  AdminService,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
import { generateFundedKey } from '../util/lib';

chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let adminService: AdminService;
  let networkService: NetworkService;
  let gatekeeperDataAccount: PublicKey;
  let stakingDataAccount: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;

  before(async () => {
    adminAuthority = await generateFundedKey();
    networkAuthority = await generateFundedKey();

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

    await networkService
      .createGatekeeper(
        networkAuthority.publicKey,
        stakingDataAccount,
        adminAuthority.publicKey
      )
      .withPartialSigners(adminAuthority)
      .rpc();
  });

  describe('Close Gatekeeper', () => {
    it('Should close a gatekeeper properly', async function () {
      let network = await adminService.getNetworkAccount();
      expect(network?.gatekeepers.length).to.equal(1);

      // runs closeGatekeeper
      await networkService
        .closeGatekeeper(
          networkAuthority.publicKey,
          undefined,
          adminAuthority.publicKey
        )
        .withPartialSigners(adminAuthority)
        .rpc();

      network = await adminService.getNetworkAccount();
      expect(network?.gatekeepers.length).to.equal(0);

      // tries to request the gatekeeper account, which we expect to fail after closure
      return expect(networkService.getGatekeeperAccount()).to.eventually.be
        .null;
    }).timeout(10000);
  });
});
