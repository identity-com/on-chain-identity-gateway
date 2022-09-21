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
  let adminDataAccount: PublicKey;
  let networkDataAccount: PublicKey;

  let adminAuthority: anchor.Wallet;
  let networkAuthority: anchor.Wallet;
  let receiver: PublicKey;

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
  describe('Withdraw from Gatekeeper', () => {
    it.only('Should let a gatekeeper initiate withdrawal', async function () {
      receiver = Keypair.generate().publicKey;
      const transactionSignature = await networkService
        .gatekeeperWithdraw(receiver)
        .rpc();
      console.log(transactionSignature);
    }).timeout(10000);
  });
});
