import {
  findGatewayPass,
  GatekeeperService,
  GatekeeperState,
  NetworkService,
  onGatewayPass,
  PassAccount,
  PassState,
} from '@identity.com/gateway-solana-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { expect } from 'chai';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import { setGatekeeperFlagsAndFees } from '../util/lib';

describe('issue', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let gatekeeperService: GatekeeperService;
  let networkService: NetworkService;

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

  beforeEach(async () => {
    ({
      gatekeeperService,
      networkService,
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
  });

  it('should issue pass', async () => {
    // Assemble
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

    // Act
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

    const pass = await gatekeeperService.getPassAccount(subject.publicKey);

    // Assert
    expect(pass?.network.toBase58()).to.equal(
      networkAuthority.publicKey.toBase58()
    );
    expect(pass?.subject.toBase58()).to.equal(subject.publicKey.toBase58());
    expect(pass?.gatekeeper.toBase58()).to.equal(gatekeeperPDA.toBase58());
    expect(pass?.version).to.equal(0);
    expect(pass?.state).to.equal(PassState.Active);

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });

  it('should transfer fees correctly to network and gatekeeper', async () => {
    // Assemble
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

    // Act
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
    expect(funderAccount.amount).to.equal(1000n);
    expect(networkAccount.amount).to.equal(1n);
    expect(gatekeeperAccount.amount).to.equal(999n);
  });

  it('should issue a free pass', async () => {
    // Assemble
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );
    await setGatekeeperFlagsAndFees(stakingPDA, networkService, 65535, [
      {
        token: mint,
        issue: 0,
        refresh: 0,
        expire: 0,
        verify: 0,
      },
    ]);

    // Act
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

    const funderAtaAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(funderAta.address);
    const funderAccount = AccountLayout.decode(funderAtaAccountInfo!.data);

    // Assert
    expect(funderAccount.amount).to.equal(2000n);
  });

  it('listens for a gateway pass to be created', async () => {
    // The promise will resolve when the token is created
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let heardCreationCallback: (pass: PassAccount) => void = () => {};

    const heardCreation = new Promise((resolve) => {
      heardCreationCallback = resolve;
    });

    const subscriptionId = await onGatewayPass(
      gatekeeperService.getConnection(),
      networkAuthority.publicKey,
      subject.publicKey,
      0,
      heardCreationCallback
    );

    gatekeeperService
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

    await heardCreation;

    await gatekeeperService
      .getConnection()
      .removeAccountChangeListener(subscriptionId);
  });

  it('Finds a gateway token after issue', async () => {
    // Assemble
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

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

    // Act
    const pass = await findGatewayPass(
      gatekeeperService.getConnection(),
      networkAuthority.publicKey,
      subject.publicKey
    );

    expect(pass?.network.toBase58()).to.equal(
      networkAuthority.publicKey.toBase58()
    );
    expect(pass?.subject.toBase58()).to.equal(subject.publicKey.toBase58());
    expect(pass?.gatekeeper.toBase58()).to.equal(gatekeeperPDA.toBase58());
    expect(pass?.version).to.equal(0);
    expect(pass?.state).to.equal(PassState.Active);

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });

  it('Finds a gateway token after issue with verification utilv', async () => {
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

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
    const pass = await gatekeeperService.getPassAccount(subject.publicKey);
    expect(pass?.state).to.equal(0);
  });

  it('Cannot issue a pass if gatekeeper is frozen', async () => {
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

    await networkService
      .setGatekeeperState(GatekeeperState.Frozen)
      .withPartialSigners(networkAuthority)
      .rpc();

    return expect(
      gatekeeperService
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
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidState/);
  });

  it('Cannot issue a pass if gatekeeper is halted', async () => {
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
      );

    await networkService
      .setGatekeeperState(GatekeeperState.Halted)
      .withPartialSigners(networkAuthority)
      .rpc();

    return expect(
      gatekeeperService
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
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidState/);
  });
});
