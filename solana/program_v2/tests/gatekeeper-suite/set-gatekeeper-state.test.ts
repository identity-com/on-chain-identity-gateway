import { AdminService } from '../../src/AdminService';
import { NetworkService } from '../../src/NetworkService';
import { GatewayV2 } from '../../target/types/gateway_v2';
import { GatekeeperState, GatekeeperStateMapping } from '../../src/lib/types';
import * as anchor from '@project-serum/anchor';
import { Enum, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { airdrop, EnumMapper, findProgramAddress } from '../../src/lib/utils';
import { expect } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
import { GatekeeperKeyFlags } from '../../src/lib/constants';
chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let adminService: AdminService;
  let networkService: NetworkService;
  let networkDataAccount: PublicKey;
  let gatekeeperDataAccount: PublicKey;

  let adminAuthority: anchor.Wallet;
  let networkAuthority: anchor.Wallet;
  let adminAddress: PublicKey;
  let stakingDataAccount: PublicKey;

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

    [networkDataAccount] = await AdminService.createNetworkAddress(
      adminAuthority.publicKey
    );
    [gatekeeperDataAccount] = await NetworkService.createGatekeeperAddress(
      adminAuthority.publicKey,
      networkDataAccount
    );
    [stakingDataAccount] = await NetworkService.createStakingAddress(
      networkAuthority.publicKey
    );

    adminService = await AdminService.buildFromAnchor(
      program,
      networkDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      gatekeeperDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    await adminService.createNetwork().rpc();
    await networkService
      .createGatekeeper(networkDataAccount, stakingDataAccount)
      .rpc();
  });
  describe('Set Gatekeeper State', () => {
    it("Should set a gatekeeper's state", async function () {
      // retrieves gatekeeper account before state change and stores its state as a const
      let gatekeeperAccount = await networkService.getGatekeeperAccount();
      const initialState = gatekeeperAccount?.state;
      // sets the gatekeeper's state to Frozen
      await networkService.setGatekeeperState(GatekeeperState.Frozen).rpc();
      // retrieves gatekeeper account after state change and stores its state as a const
      gatekeeperAccount = await networkService.getGatekeeperAccount();
      const newState = gatekeeperAccount?.state;

      //@ts-ignore // Expects initial state of gatekeeper to be 0 (Active)
      expect(EnumMapper.from(initialState, GatekeeperStateMapping)).to.equal(0);
      //@ts-ignore // Expects modified state of gatekeeper to be 1 (Frozen)
      expect(EnumMapper.from(newState, GatekeeperStateMapping)).to.equal(1);
    }).timeout(10000);
  });
});
