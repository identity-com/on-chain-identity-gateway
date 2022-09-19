import { GatewayService } from '../../src/GatewayService';
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

  let networkService: GatewayService;
  let gatekeeperService: GatewayService;
  let networkDataAccount: PublicKey;
  let gatekeeperDataAccount: PublicKey;

  let networkAuthority: anchor.Wallet;
  let gatekeeperAuthority: anchor.Wallet;
  let networkAddress;

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

    console.log('both airdrops');

    [networkDataAccount] = await GatewayService.createNetworkAddress(
      networkAuthority.publicKey
    );
    [gatekeeperDataAccount] = await GatewayService.createNetworkAddress(
      gatekeeperAuthority.publicKey
    );

    console.log('both data accounts');

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
      gatekeeperAuthority
    );

    console.log('both services built from anchor');

    await networkService.createNetwork().rpc();
    networkAddress = await findProgramAddress(networkAuthority.publicKey);
  });
  describe('Create Gatekeeper', () => {
    it.only(
      'Creates a gatekeeper on an established network',
      async function () {
        console.log('before createGatekeeper');
        let gatekeeper = await gatekeeperService
          .createGatekeeper(networkAddress)
          .rpc();
      }
    ).timeout(10000);
  });
});
