import {
  AdminService,
  airdrop,
  GatekeeperService,
  GatekeeperState,
  NetworkService,
  PassState,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import {
  Account,
  AccountLayout,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Verify a pass', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let gatekeeperService: GatekeeperService;
  let networkService: NetworkService;

  let gatekeeperPDA: PublicKey;
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
      gatekeeperService,
      gatekeeperPDA,
      passAccount,
      mint,
      adminAuthority,
      networkAuthority,
      gatekeeperAuthority,
      mintAuthority,
      subject,
      mintAccount,
      networkService,
    } = await setUpAdminNetworkGatekeeper(program, programProvider));

    ({ gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA,
        10000
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

  it('Verifies a valid pass', async () => {
    await gatekeeperService
      .verifyPass(
        passAccount,
        TOKEN_PROGRAM_ID,
        mint,
        networkAta.address,
        gatekeeperAta.address,
        funderAta.address,
        funderKeypair.publicKey
      )
      .withPartialSigners(funderKeypair)
      .rpc();

    const funderAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(funderAta.address);

    const networkAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(networkAta.address);

    const gatekeeperAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(gatekeeperAta.address);

    const funderAccount = AccountLayout.decode(funderAtaAccountInfo!.data);
    const networkAccount = AccountLayout.decode(networkAtaAccountInfo!.data);
    const gatekeeperAccount = AccountLayout.decode(
      gatekeeperAtaAccountInfo!.data
    );

    // Assert
    expect(funderAccount.amount).to.equal(8000n);
    expect(networkAccount.amount).to.equal(2n);
    expect(gatekeeperAccount.amount).to.equal(1998n);
  });

  it('Verifies a valid pass', async () => {
    await gatekeeperService
      .verifyPass(
        passAccount,
        TOKEN_PROGRAM_ID,
        mint,
        networkAta.address,
        gatekeeperAta.address,
        funderAta.address,
        funderKeypair.publicKey
      )
      .withPartialSigners(funderKeypair)
      .rpc();

    const funderAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(funderAta.address);

    const networkAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(networkAta.address);

    const gatekeeperAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(gatekeeperAta.address);

    const funderAccount = AccountLayout.decode(funderAtaAccountInfo!.data);
    const networkAccount = AccountLayout.decode(networkAtaAccountInfo!.data);
    const gatekeeperAccount = AccountLayout.decode(
      gatekeeperAtaAccountInfo!.data
    );

    // Assert
    expect(funderAccount.amount).to.equal(8000n);
    expect(networkAccount.amount).to.equal(2n);
    expect(gatekeeperAccount.amount).to.equal(1998n);
  });

  it('Fails to verify a pass in a halted gatekeeper', async () => {
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Halted)
      .rpc();

    return expect(
      gatekeeperService
        .verifyPass(
          passAccount,
          TOKEN_PROGRAM_ID,
          mint,
          networkAta.address,
          gatekeeperAta.address,
          funderAta.address,
          funderKeypair.publicKey
        )
        .withPartialSigners(funderKeypair)
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidState/);
  });

  it('Succeeds to verify a pass in a frozen gatekeeper', async () => {
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Frozen)
      .rpc();

    await gatekeeperService
      .verifyPass(
        passAccount,
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

  it('Fails to verify an expired pass', async () => {
    await gatekeeperService
      .expirePass(
        passAccount,
        TOKEN_PROGRAM_ID,
        mint,
        networkAta.address,
        gatekeeperAta.address,
        funderAta.address,
        funderKeypair.publicKey
      )
      .withPartialSigners(funderKeypair)
      .rpc();

    return expect(
      gatekeeperService
        .verifyPass(
          passAccount,
          TOKEN_PROGRAM_ID,
          mint,
          networkAta.address,
          gatekeeperAta.address,
          funderAta.address,
          funderKeypair.publicKey
        )
        .withPartialSigners(funderKeypair)
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it('Fails to verify an inactive pass', async () => {
    await gatekeeperService.setState(PassState.Revoked, passAccount).rpc();

    expect(
      gatekeeperService
        .verifyPass(
          passAccount,
          TOKEN_PROGRAM_ID,
          mint,
          networkAta.address,
          gatekeeperAta.address,
          funderAta.address,
          funderKeypair.publicKey
        )
        .withPartialSigners(funderKeypair)
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it('Fails to verify a pass in a different network', async () => {
    const altNetwork = Keypair.generate();
    const wallet = new anchor.Wallet(adminAuthority);

    await airdrop(
      programProvider.connection,
      adminAuthority.publicKey,
      LAMPORTS_PER_SOL
    );

    await airdrop(
      programProvider.connection,
      altNetwork.publicKey,
      LAMPORTS_PER_SOL
    );

    const altNetworkAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mint,
      altNetwork.publicKey,
      false
    );

    const altAdminService = await AdminService.buildFromAnchor(
      program,
      altNetwork.publicKey,
      {
        clusterType: 'localnet',
        wallet: wallet,
      }
    );

    await altAdminService.createNetwork().withPartialSigners(altNetwork).rpc();

    const altService = await GatekeeperService.buildFromAnchor(
      program,
      altNetwork.publicKey,
      gatekeeperPDA,
      {
        clusterType: 'localnet',
        wallet: wallet,
      },
      programProvider
    );

    return expect(
      altService
        .verifyPass(
          passAccount,
          TOKEN_PROGRAM_ID,
          mint,
          altNetworkAta.address,
          gatekeeperAta.address,
          funderAta.address,
          funderKeypair.publicKey
        )
        .withPartialSigners(funderKeypair)
        .rpc()
    ).to.eventually.be.rejectedWith(/A seeds constraint was violated/);
  });
});
