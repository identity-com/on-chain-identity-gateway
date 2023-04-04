import {
  AdminService,
  NetworkKeyFlags,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as chai from 'chai';
import { expect } from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
import { generateFundedKey } from '../util/lib';
import { NetworkFeatures } from '@identity.com/gateway-solana-client/dist/lib/constants';

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

  let feePayerAuthority: Keypair;
  let adminAuthority: Keypair;
  let gatekeeperAuthority: Keypair;
  let networkAuthority: Keypair;

  before(async () => {
    feePayerAuthority = await generateFundedKey();
    adminAuthority = await generateFundedKey();
    gatekeeperAuthority = await generateFundedKey();
    networkAuthority = await generateFundedKey();

    [gatekeeperDataAccount] = await NetworkService.createGatekeeperAddress(
      gatekeeperAuthority.publicKey,
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
      networkAuthority.publicKey,
      gatekeeperAuthority.publicKey,
      gatekeeperDataAccount,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(feePayerAuthority),
      },
      programProvider
    );

    await adminService
      .createNetwork({
        authThreshold: 1,
        passExpireTime: 10000,
        fees: [
          {
            token: PublicKey.unique(),
            issue: 10,
            refresh: 10,
            expire: 10,
            verify: 10,
          },
        ],
        authKeys: [
          {
            flags: NetworkKeyFlags.AUTH | NetworkKeyFlags.CREATE_GATEKEEPER,
            key: networkAuthority.publicKey,
          },
        ],
        supportedTokens: [{ key: PublicKey.unique() }],
        networkFeatures: NetworkFeatures.CHANGE_PASS_GATEKEEPER,
      })
      .withPartialSigners(networkAuthority)
      .rpc();

    await networkService
      .createGatekeeper(stakingDataAccount)
      .withPartialSigners(networkAuthority)
      .rpc();
  });

  describe('Close Gatekeeper', () => {
    it('Should close a gatekeeper properly', async function () {
      let network = await adminService.getNetworkAccount();
      expect(network?.gatekeepers.length).to.equal(1);

      // runs closeGatekeeper
      await networkService
        .closeGatekeeper()
        .withPartialSigners(networkAuthority)
        .rpc();

      network = await adminService.getNetworkAccount();
      expect(network?.gatekeepers.length).to.equal(0);

      // tries to request the gatekeeper account, which we expect to fail after closure
      return expect(networkService.getGatekeeperAccount()).to.eventually.be
        .null;
    }).timeout(10000);
  });
});
