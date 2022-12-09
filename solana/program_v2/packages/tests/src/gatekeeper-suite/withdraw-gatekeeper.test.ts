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
  GatekeeperService,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';

describe.only('withdraw gatekeeper', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let gatekeeperService: GatekeeperService;
  let networkService: NetworkService;

  let gatekeeperPDA: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;
  let mintAuthority: Keypair;
  let mintAccount: Keypair;

  beforeEach(async () => {
    ({
      gatekeeperService,
      networkService,
      gatekeeperPDA,
      adminAuthority,
      networkAuthority,
      gatekeeperAuthority,
      mintAuthority,
      mintAccount,
    } = await setUpAdminNetworkGatekeeper(program, programProvider));
  });

  it.only('should withdraw gatekeeper', async () => {
    // Assemble
    const { gatekeeperAta } = await makeAssociatedTokenAccountsForIssue(
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
    await networkService
      .gatekeeperWithdraw(
        gatekeeperAuthority.publicKey,
        networkAuthority.publicKey,
        TOKEN_PROGRAM_ID,
        gatekeeperAta.address,
        toTokenAta.address,
        1
      )
      .rpc()
      .catch((e) => console.log(e));

    // Assert
    const toTokenAccountInfo = await gatekeeperService
      .getConnection()
      .getAccountInfo(toTokenAta.address);
    const toTokenAccount = AccountLayout.decode(toTokenAccountInfo!.data);

    // Assert
    expect(toTokenAccount.amount).to.equal(1n);
  });
});
