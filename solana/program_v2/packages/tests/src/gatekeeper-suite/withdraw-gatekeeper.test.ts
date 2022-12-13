import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import {
  AccountLayout,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  airdrop,
  GatekeeperService,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import { Account } from '@solana/spl-token/src/state/account';

describe('withdraw gatekeeper', () => {
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
      networkService,
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

  it('should withdraw gatekeeper', async () => {
    // Assemble
    const toAccount = Keypair.generate();
    const receiverTokenAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );

    await airdrop(programProvider.connection, gatekeeperAta.address, 1000);

    // Act
    await networkService
      .gatekeeperWithdraw(
        gatekeeperService.getGatekeeper(),
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        TOKEN_PROGRAM_ID,
        receiverTokenAta!.address,
        gatekeeperAta.address,
        1
      )
      .withPartialSigners(gatekeeperAuthority)
      .rpc();

    const gatekeeperAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(gatekeeperAta.address);
    const receiverAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(receiverTokenAta.address);

    const gatekeeperData = AccountLayout.decode(gatekeeperAccountInfo!.data);
    const receiverData = AccountLayout.decode(receiverAccountInfo!.data);

    // Assert
    expect(gatekeeperData.amount).to.equal(998n);
    expect(receiverData.amount).to.equal(1n);
  });

  it('should withdraw all', async () => {
    // Assemble
    const toAccount = Keypair.generate();
    const receiverTokenAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );

    // Act
    await networkService
      .gatekeeperWithdraw(
        gatekeeperService.getGatekeeper(),
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        TOKEN_PROGRAM_ID,
        receiverTokenAta!.address,
        gatekeeperAta.address,
        0
      )
      .withPartialSigners(gatekeeperAuthority)
      .rpc();

    const gatekeeperAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(gatekeeperAta.address);
    const receiverAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(receiverTokenAta.address);

    const gatekeeperData = AccountLayout.decode(gatekeeperAccountInfo!.data);
    const receiverData = AccountLayout.decode(receiverAccountInfo!.data);

    // Assert
    expect(gatekeeperData.amount).to.equal(0n);
    expect(receiverData.amount).to.equal(999n);
  });
});
