import {
  findGatewayPass,
  GatekeeperService,
  onGatewayPass,
  PassAccount,
  PassState,
} from '@identity.com/gateway-solana-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { expect } from 'chai';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';

describe('issue', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let gatekeeperService: GatekeeperService;

  let gatekeeperPDA: PublicKey;
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
      gatekeeperPDA,
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

  it.only('should issue pass', async () => {
    try {
      console.log('A');
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
      console.log('B');

      // Act
      await gatekeeperService
        .issue(
          passAccount,
          subject.publicKey,
          TOKEN_PROGRAM_ID,
          mint,
          gatekeeperAta.address,
          networkAta.address,
          funderAta.address,
          funderKeypair.publicKey
        )
        .withPartialSigners(funderKeypair)
        .rpc();
    } catch (e) {
      console.log(e);
      throw e;
    }
    console.log('C');
    const pass = await gatekeeperService.getPassAccount(subject.publicKey);

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject: subject.publicKey,
      network: networkAuthority.publicKey,
      gatekeeper: gatekeeperPDA,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });

  it('should transfer fees correctly to network and gatekeeper', async () => {
    // Assemble
    const { gatekeeperAta, networkAta, funderAta } =
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
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc()
      .catch((e) => console.log(e));
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

  it('listens for a gateway pass to be created', async () => {
    // The promise will resolve when the token is created
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const { gatekeeperAta, networkAta, funderAta } =
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

    const account = await GatekeeperService.createPassAddress(
      subject.publicKey,
      networkAuthority.publicKey
    );

    gatekeeperService
      .issue(
        account,
        subject.publicKey,
        TOKEN_PROGRAM_ID,
        mint,
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc();

    await heardCreation;

    await gatekeeperService
      .getConnection()
      .removeAccountChangeListener(subscriptionId);
  });

  it('Finds a gateway token after issue', async () => {
    // Assemble
    const { gatekeeperAta, networkAta, funderAta } =
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
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc();

    // Act
    const pass = await findGatewayPass(
      gatekeeperService.getConnection(),
      networkAuthority.publicKey,
      subject.publicKey
    );

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject: subject.publicKey,
      network: networkAuthority.publicKey,
      gatekeeper: gatekeeperPDA,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });

  it.skip('Finds a gateway token after issue with verification util', async () => {
    const { gatekeeperAta, networkAta, funderAta } =
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
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc();
    const pass = await findGatewayPass(
      programProvider.connection,
      networkAuthority.publicKey,
      passAccount
    );
    expect(pass?.state).to.equal(0);
  });
});
