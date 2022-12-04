import {
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
  GatekeeperService,
} from '@identity.com/gateway-solana-client';

describe.only('Withdraw network', () => {
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

  it.only('should be able to withdraw network', async () => {
    // Assemble
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
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );
    console.log('toTokenAccount', toTokenAccount);
    try {
      // Act
      await adminService
        .withdraw(
          100,
          networkAuthority.publicKey,
          TOKEN_PROGRAM_ID,
          networkAta.address,
          toTokenAccount.address
        )
        .rpc();
    } catch (e) {
      console.log(e);
    }

    // Assert
  });

  it('should not be able to withdraw network if not admin');

  it('should with the specified amount');
});
