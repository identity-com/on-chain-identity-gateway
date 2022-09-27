import { AdminService } from '../../src/AdminService';
import { NetworkService } from '../../src/NetworkService';
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

  let adminService: AdminService;
  let networkService: NetworkService;
  let adminDataAccount: PublicKey;
  let networkDataAccount: PublicKey;

  let adminAuthority: anchor.Wallet;
  let networkAuthority: anchor.Wallet;
  let additionalAuthKey = Keypair.generate().publicKey;

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

    [adminDataAccount] = await AdminService.createNetworkAddress(
      adminAuthority.publicKey
    );
    [networkDataAccount] = await NetworkService.createGatekeeperAddress(
      adminAuthority.publicKey
    );

    adminService = await AdminService.buildFromAnchor(
      program,
      adminDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      networkDataAccount,
      'localnet',
      programProvider,
      adminAuthority
    );

    await adminService.createNetwork().rpc();
    await networkService.createGatekeeper(adminAuthority.publicKey).rpc();
  });
  describe('Update Gatekeeper', () => {
    it('Updates a gatekeeper on an established network', async function () {
      // updates gatekeeper with new data
      await networkService
        .updateGatekeeper({
          authThreshold: 1,
          authKeys: {
            add: [{ flags: 4097, key: additionalAuthKey }],
            remove: [],
          },
          gatekeeperNetwork: adminAuthority.publicKey,
          addresses: null,
          stakingAccount: null,
          fees: { add: [], remove: [] },
        })
        .rpc();
      // retrieves the gatekeeper account
      let gatekeeperAccount = await networkService.getGatekeeperAccount();
      // expects there to be an additional auth key matching the additionalKey defined above
      expect(
        gatekeeperAccount?.authKeys.filter(
          (auth) => auth.key.toBase58() === additionalAuthKey.toBase58()
        ).length
      ).to.equal(1);
    }).timeout(10000);
  });
});