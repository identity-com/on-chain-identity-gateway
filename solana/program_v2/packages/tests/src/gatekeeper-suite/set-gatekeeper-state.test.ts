import {
  AdminService,
  NetworkService,
  airdrop,
  EnumMapper,
  GatekeeperState,
  GatekeeperStateMapping,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';

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

    await networkService
      .createGatekeeper(
        networkAuthority.publicKey,
        stakingDataAccount,
        adminAuthority.publicKey
      )
      .withPartialSigners(adminAuthority)
      .rpc();
  });

  describe('Set Gatekeeper State', () => {
    it("Should set a gatekeeper's state", async function () {
      // retrieves gatekeeper account before state change and stores its state as a const
      let gatekeeperAccount = await networkService.getGatekeeperAccount();
      const initialState = gatekeeperAccount?.state;
      // sets the gatekeeper's state to Frozen
      await networkService
        .setGatekeeperState(
          GatekeeperState.Frozen,
          undefined,
          networkAuthority.publicKey
        )
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
