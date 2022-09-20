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
  let additionalAuthKey = Keypair.generate().publicKey;

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
  describe('Update Gatekeeper', () => {
    it('Updates a gatekeeper on an established network', async function () {
      await gatekeeperService
        .updateGatekeeper({
          authThreshold: 1,
          authKeys: {
            add: [{ flags: 4097, key: additionalAuthKey }],
            remove: [],
          },
          gatekeeperNetwork: networkAuthority.publicKey,
          addresses: null,
          stakingAccount: null,
          fees: { add: [], remove: [] },
        })
        .rpc();
      let gatekeeperAccount = await gatekeeperService.getGatekeeperAccount();
      expect(
        gatekeeperAccount?.authKeys.filter(
          (auth) => auth.key.toBase58() === additionalAuthKey.toBase58()
        ).length
      ).to.equal(1);
    }).timeout(10000);
  });
});
