import {
  GatekeeperService,
  NetworkService,
  GatekeeperKeyFlags,
  airdrop,
  AdminService,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { setGatekeeperFlagsAndFees } from '../util/lib';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { Account, TOKEN_PROGRAM_ID } from '@solana/spl-token';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Change pass gatekeeper', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let networkService: NetworkService;
  let gatekeeperService: GatekeeperService;

  let gatekeeperPDA: PublicKey;
  let stakingPDA: PublicKey;
  let passAccount: PublicKey;
  let mint: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;
  let mintAuthority: Keypair;
  let subject: Keypair;
  let mintAccount: Keypair;
  let funderKeypair: Keypair;
  let gatekeeperAta: Account;
  let networkAta: Account;
  let funderAta: Account;

  beforeEach(async () => {
    ({
      networkService,
      gatekeeperService,
      gatekeeperPDA,
      stakingPDA,
      passAccount,
      mint,
      adminAuthority,
      networkAuthority,
      gatekeeperAuthority,
      mintAuthority,
      subject,
      mintAccount,
    } = await setUpAdminNetworkGatekeeper(program, programProvider));
    ({ gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      ));
    await gatekeeperService
      .issue(
        passAccount,
        subject.publicKey,
        TOKEN_PROGRAM_ID,
        mint,
        networkAta.address,
        gatekeeperAta.address,
        funderAta.address,
        funderKeypair.publicKey
      )
      .withPartialSigners(funderKeypair)
      .rpc();
  });

  it('Can change to gatekeeper within the same network', async () => {
    // Assemble
    const dataAcct = networkService.getGatekeeperAddress();
    await setGatekeeperFlagsAndFees(
      stakingPDA,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER
    );

    // Act
    await gatekeeperService.changePassGatekeeper(dataAcct, passAccount).rpc();

    const pass = await gatekeeperService.getPassAccount(subject.publicKey);
    const newDataAcct = networkService.getGatekeeperAddress()?.toBase58();

    // Assert
    expect(pass?.gatekeeper.toBase58()).to.equal(newDataAcct);
  });

  it('Cannot change to gatekeeper within a different network', async () => {
    // Assemble
    const newAdminAuthority = Keypair.generate();
    const newNetworkAuthority = Keypair.generate();
    const newGatekeeperAuthority = Keypair.generate();

    //network airdrop
    await airdrop(
      programProvider.connection,
      newAdminAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      newNetworkAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      newGatekeeperAuthority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const [gatekeeperDataAccount] =
      await NetworkService.createGatekeeperAddress(
        newGatekeeperAuthority.publicKey,
        newNetworkAuthority.publicKey
      );
    const [stakingDataAccount] = await NetworkService.createStakingAddress(
      newNetworkAuthority.publicKey
    );

    const newAdminService = await AdminService.buildFromAnchor(
      program,
      newNetworkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(newAdminAuthority),
      },
      programProvider
    );

    const newNetworkService = await NetworkService.buildFromAnchor(
      program,
      newGatekeeperAuthority.publicKey,
      gatekeeperDataAccount,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(newGatekeeperAuthority),
      },
      programProvider
    );

    await newAdminService
      .createNetwork()
      .withPartialSigners(newNetworkAuthority)
      .rpc();

    await newNetworkService
      .createGatekeeper(
        newNetworkAuthority.publicKey,
        stakingDataAccount,
        newAdminAuthority.publicKey
      )
      .withPartialSigners(newAdminAuthority)
      .rpc();

    // Act + Assert

    expect(
      gatekeeperService
        .changePassGatekeeper(gatekeeperDataAccount, passAccount)
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidNetwork/);
  });
});
