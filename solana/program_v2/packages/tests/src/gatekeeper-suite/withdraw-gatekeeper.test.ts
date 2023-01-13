import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import {
  AccountLayout,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  GatekeeperKeyFlags,
  GatekeeperService,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import { Account } from '@solana/spl-token/src/state/account';
import { setGatekeeperFlagsAndFees } from '../util/lib';

describe('withdraw gatekeeper', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let gatekeeperService: GatekeeperService;
  let networkService: NetworkService;

  let gatekeeperPDA: PublicKey;
  let stakingPDA: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;
  let mintAuthority: Keypair;
  let mintAccount: Keypair;
  let receiverTokenAta: Account;
  let gatekeeperAta: Account;

  beforeEach(async () => {
    ({
      gatekeeperService,
      gatekeeperPDA,
      networkService,
      adminAuthority,
      networkAuthority,
      gatekeeperAuthority,
      mintAuthority,
      mintAccount,
      stakingPDA,
    } = await setUpAdminNetworkGatekeeper(program, programProvider));
    ({ gatekeeperAta } = await makeAssociatedTokenAccountsForIssue(
      programProvider.connection,
      adminAuthority,
      mintAuthority,
      networkAuthority.publicKey,
      gatekeeperAuthority.publicKey,
      mintAccount.publicKey,
      gatekeeperPDA
    ));
    const toAccount = Keypair.generate();
    receiverTokenAta = await getOrCreateAssociatedTokenAccount(
      programProvider.connection,
      adminAuthority,
      mintAccount.publicKey,
      toAccount.publicKey,
      true
    );

    await mintTo(
      programProvider.connection,
      gatekeeperAuthority,
      mintAccount.publicKey,
      gatekeeperAta.address,
      mintAuthority,
      1000
    );

    await setGatekeeperFlagsAndFees(
      stakingPDA,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.WITHDRAW
    );
  });

  it('should withdraw gatekeeper', async () => {
    // Act
    await networkService
      .gatekeeperWithdraw(
        gatekeeperService.getGatekeeper(),
        gatekeeperAuthority.publicKey,
        TOKEN_PROGRAM_ID,
        receiverTokenAta.address,
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
    expect(gatekeeperData.amount).to.equal(999n);
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
    expect(receiverData.amount).to.equal(1000n);
  });
});
