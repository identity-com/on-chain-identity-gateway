import {
  AdminService,
  NetworkService,
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
  let networkDataAccount: PublicKey;
  let gatekeeperDataAccount: PublicKey;
  let stakingDataAccount: PublicKey;

  let adminAuthority: anchor.Wallet;
  let networkAuthority: anchor.Wallet;
  const additionalAuthKey = Keypair.generate().publicKey;

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
      adminAuthority.publicKey,
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
  describe('Update Gatekeeper', () => {
    it('Updates a gatekeeper on an established network', async function () {
      // updates gatekeeper with new data
      await networkService
        .updateGatekeeper(
          {
            authThreshold: 1,
            tokenFees: { add: [], remove: [] },
            authKeys: {
              add: [{ flags: 4097, key: additionalAuthKey }],
              remove: [],
            },
          },
          stakingDataAccount
        )
        .rpc();
      // retrieves the gatekeeper account
      const gatekeeperAccount = await networkService.getGatekeeperAccount();
      // expects there to be an additional auth key matching the additionalKey defined above
      expect(
        gatekeeperAccount?.authKeys.filter(
          (auth) => auth.key.toBase58() === additionalAuthKey.toBase58()
        ).length
      ).to.equal(1);
    }).timeout(10000);
  });
});
