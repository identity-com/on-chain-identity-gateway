import { GatewayService } from '../../src/GatewayService';
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
  describe('Close Gatekeeper', () => {
    it('Should close a gatekeeper properly', async function () {
      await gatekeeperService.closeGatekeeper().rpc();
      expect(gatekeeperService.getGatekeeperAccount()).to.eventually.be
        .rejected;
    }).timeout(10000);
  });
});
