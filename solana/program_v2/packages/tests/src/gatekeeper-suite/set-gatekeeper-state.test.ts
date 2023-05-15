import {
  AdminService,
  CreateNetworkData,
  EnumMapper,
  FeeStructure,
  GatekeeperState,
  GatekeeperStateMapping,
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

chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;
  const fees: FeeStructure = {
    token: PublicKey.unique(),
    issue: 100,
    expire: 100,
    verify: 100,
    refresh: 100,
  };
  let adminService: AdminService;
  let networkService: NetworkService;
  let gatekeeperDataAccount: PublicKey;
  let stakingDataAccount: PublicKey;

  let feePayerAuthority: Keypair;
  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;

  beforeEach(async () => {
    feePayerAuthority = await generateFundedKey();
    adminAuthority = await generateFundedKey();
    networkAuthority = await generateFundedKey();
    gatekeeperAuthority = await generateFundedKey();

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

    const networkData: CreateNetworkData = {
      authThreshold: 1,
      passExpireTime: 16,
      fees: [fees],
      authKeys: [
        {
          flags: NetworkKeyFlags.AUTH | NetworkKeyFlags.CREATE_GATEKEEPER,
          key: networkAuthority.publicKey,
        },
      ],
      supportedTokens: [],
      networkFeatures: 0,
    };
    await adminService
      .createNetwork(networkData)
      .withPartialSigners(networkAuthority)
      .rpc();

    await networkService
      .createGatekeeper(stakingDataAccount)
      .withPartialSigners(networkAuthority)
      .rpc();
  });

  describe('Set Gatekeeper State', () => {
    it("Should set a gatekeeper's state", async function () {
      // retrieves gatekeeper account before state change and stores its state as a const
      let gatekeeperAccount = await networkService.getGatekeeperAccount();
      const initialState = gatekeeperAccount?.state;
      // sets the gatekeeper's state to Frozen
      await networkService
        .setGatekeeperState(GatekeeperState.Frozen)
        .withPartialSigners(networkAuthority)
        .rpc();
      // retrieves gatekeeper account after state change and stores its state as a const
      gatekeeperAccount = await networkService.getGatekeeperAccount();
      const newState = gatekeeperAccount?.state;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore // Expects initial state of gatekeeper to be 0 (Active)
      expect(EnumMapper.from(initialState, GatekeeperStateMapping)).to.equal(0);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore // Expects modified state of gatekeeper to be 1 (Frozen)
      expect(EnumMapper.from(newState, GatekeeperStateMapping)).to.equal(1);
    }).timeout(10000);
  });
});
