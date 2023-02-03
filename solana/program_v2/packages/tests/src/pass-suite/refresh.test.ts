import {
  GatekeeperService,
  GatekeeperState,
  NetworkService,
  PassAccount,
  PassState,
} from '@identity.com/gateway-solana-client';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token/src/state/account';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

chai.use(chaiAsPromised);

describe('Refresh a pass', () => {
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

  it('should refresh a pass', async () => {
    // Assemble
    const initialPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

    // Sleep a bit so the expiry time passes
    await new Promise((r) => setTimeout(r, 2000));

    // Act
    await gatekeeperService
      .refreshPass(
        passAccount,
        gatekeeperAuthority.publicKey,
        TOKEN_PROGRAM_ID,
        mint,
        networkAta.address,
        gatekeeperAta.address,
        funderAta.address,
        funderKeypair.publicKey
      )
      .withPartialSigners(funderKeypair)
      .rpc();
    const updatedPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

    // Assert
    expect(initialPass?.issueTime).to.be.lt(
      (updatedPass as PassAccount).issueTime
    );
  });

  it('should not refresh a pass if gatekeeper is halted', async () => {
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Halted)
      .rpc();

    // Act
    return expect(
      gatekeeperService
        .refreshPass(
          passAccount,
          gatekeeperAuthority.publicKey,
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
  it('should not refresh a pass if gatekeeper is frozen', async () => {
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Frozen)
      .rpc();

    // Act
    return expect(
      gatekeeperService
        .refreshPass(
          passAccount,
          gatekeeperAuthority.publicKey,
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

  it('Should not refresh a frozen pass', async () => {
    // Assemble
    await gatekeeperService.setState(PassState.Frozen, passAccount).rpc();

    // Act + Assert
    return expect(
      gatekeeperService
        .refreshPass(
          passAccount,
          gatekeeperAuthority.publicKey,
          TOKEN_PROGRAM_ID,
          mint,
          networkAta.address,
          gatekeeperAta.address,
          funderAta.address,
          funderKeypair.publicKey
        )
        .withPartialSigners(funderKeypair)
        .rpc()
    ).to.eventually.be.rejectedWith(/PassNotActive/);
  });

  it('should transfer fees to gatekeeper and network', async () => {
    // Assemble
    // Act
    await gatekeeperService
      .refreshPass(
        passAccount,
        gatekeeperAuthority.publicKey,
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
    expect(funderAccount.amount).to.equal(0n);
    expect(networkAccount.amount).to.equal(1000n);
    expect(gatekeeperAccount.amount).to.equal(1000n);
  });

  it('Cannot issue a pass if gatekeeper is frozen', async () => {
    // Assemble
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Frozen)
      .rpc();
    // Act + Assert
    return expect(
      gatekeeperService
        .refreshPass(
          passAccount,
          gatekeeperAuthority.publicKey,
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

  it('Cannot refresh a pass if gatekeeper is halted', async () => {
    // Assemble
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Halted)
      .rpc();
    // Act + Assert
    return expect(
      gatekeeperService
        .refreshPass(
          passAccount,
          gatekeeperAuthority.publicKey,
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
