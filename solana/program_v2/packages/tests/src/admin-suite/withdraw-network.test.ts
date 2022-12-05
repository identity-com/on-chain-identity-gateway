import {
  AccountLayout,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  AdminService,
  airdrop,
  GatekeeperService,
} from '@identity.com/gateway-solana-client';
import { expect } from 'chai';

describe('Withdraw network', () => {
  // Set the provider to the test environment.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let gatekeeperService: GatekeeperService;
  let adminService: AdminService;

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
      adminService,
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

    const { networkAta, gatekeeperAta, funderAta } =
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
  });

  it('should be able to withdraw network', async () => {
    // Assemble
    const expectedAmount = 1;
    const { networkAta } = await makeAssociatedTokenAccountsForIssue(
      programProvider.connection,
      adminAuthority,
      mintAuthority,
      networkAuthority.publicKey,
      gatekeeperAuthority.publicKey,
      mintAccount.publicKey,
      gatekeeperPDA
    );
    const toAccount = Keypair.generate();
    const toTokenAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );
    await airdrop(programProvider.connection, networkAta.address, 1000);

    // Act
    await adminService
      .withdraw(
        expectedAmount,
        adminAuthority.publicKey,
        TOKEN_PROGRAM_ID,
        networkAta.address,
        toTokenAta.address
      )
      .rpc();

    const toTokenAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(toTokenAta.address);
    const toTokenAccount = AccountLayout.decode(toTokenAccountInfo!.data);

    // Assert
    expect(toTokenAccount.amount).to.equal(1n);
  });

  it('should not be able to withdraw network if not admin', async () => {
    const { networkAta } = await makeAssociatedTokenAccountsForIssue(
      programProvider.connection,
      adminAuthority,
      mintAuthority,
      networkAuthority.publicKey,
      gatekeeperAuthority.publicKey,
      mintAccount.publicKey,
      gatekeeperPDA
    );
    const toAccount = Keypair.generate();
    const toTokenAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );
    await airdrop(programProvider.connection, networkAta.address, 1000);

    // Act
    const service = adminService
      .withdraw(
        1,
        networkAuthority.publicKey,
        TOKEN_PROGRAM_ID,
        networkAta.address,
        toTokenAta.address
      )
      .rpc();

    // Assert
    expect(service).to.be.rejectedWith(
      'Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1'
    );
  });

  it('should withdraw the max amount', async () => {
    // Assemble
    const expectedAmount = 1n;
    const { networkAta } = await makeAssociatedTokenAccountsForIssue(
      programProvider.connection,
      adminAuthority,
      mintAuthority,
      networkAuthority.publicKey,
      gatekeeperAuthority.publicKey,
      mintAccount.publicKey,
      gatekeeperPDA
    );
    const toAccount = Keypair.generate();
    const toTokenAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );

    // Act
    await adminService
      .withdraw(
        0,
        adminAuthority.publicKey,
        TOKEN_PROGRAM_ID,
        networkAta.address,
        toTokenAta.address
      )
      .rpc();

    const toTokenAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(toTokenAta.address);
    const toTokenAccount = AccountLayout.decode(toTokenAccountInfo!.data);

    // Assert
    expect(toTokenAccount.amount).to.equal(expectedAmount);
  });
});
