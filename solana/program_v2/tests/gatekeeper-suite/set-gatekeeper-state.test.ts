import { GatewayService } from '../../src/GatewayService';
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

  let networkService: GatewayService;
  let gatekeeperService: GatewayService;
  let networkDataAccount: PublicKey;
  let gatekeeperDataAccount: PublicKey;

  let networkAuthority: anchor.Wallet;
  let gatekeeperAuthority: anchor.Wallet;
  let networkAddress: PublicKey;

  before(async () => {
    networkAuthority = new anchor.Wallet(Keypair.generate());
    gatekeeperAuthority = new anchor.Wallet(Keypair.generate());

    //network airdrop
    await airdrop(
      programProvider.connection,
      networkAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      gatekeeperAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    [networkDataAccount] = await GatewayService.createNetworkAddress(
      networkAuthority.publicKey
    );
    [gatekeeperDataAccount] = await GatewayService.createGatekeeperAddress(
      networkAuthority.publicKey
    );

    networkService = await GatewayService.buildFromAnchor(
      program,
      networkDataAccount,
      'localnet',
      programProvider,
      networkAuthority
    );

    gatekeeperService = await GatewayService.buildFromAnchor(
      program,
      gatekeeperDataAccount,
      'localnet',
      programProvider,
      networkAuthority
    );

    await networkService.createNetwork().rpc();
    await gatekeeperService.createGatekeeper(networkAuthority.publicKey).rpc();
  });
  describe('Set Gatekeeper State', () => {
    it.only("Should set a gatekeeper's state", async function () {
      let gatekeeperAccount = await gatekeeperService.getGatekeeperAccount();
      const initialState = gatekeeperAccount?.state;

      await gatekeeperService.setGatekeeperState(GatekeeperState.Frozen).rpc();
      gatekeeperAccount = await gatekeeperService.getGatekeeperAccount();
      const newState = gatekeeperAccount?.state;

      //@ts-ignore
      expect(EnumMapper.from(initialState, GatekeeperStateMapping)).to.equal(0);
      //@ts-ignore
      expect(EnumMapper.from(newState, GatekeeperStateMapping)).to.equal(1);
    }).timeout(10000);
  });
});
