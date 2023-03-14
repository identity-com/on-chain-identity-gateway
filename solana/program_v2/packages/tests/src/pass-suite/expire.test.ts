import {
  GatekeeperService,
  GatekeeperState,
  NetworkService,
  PassState,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import { Account, AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Expire a pass', () => {
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
        3000
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

  it('Expires a pass', async () => {
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

    const updatedPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

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
    expect(networkAccount.amount).to.equal(2n);
    expect(gatekeeperAccount.amount).to.equal(1998n);

    expect(updatedPass?.issueTime).to.be.lt(0);
  });

  it('Can expire a pass if the gatekeeper is frozen', async () => {
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Frozen)
      .rpc();

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

    const updatedPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

    expect(updatedPass?.issueTime).to.be.lt(0);
  });

  it('Cannot expire a pass if the gatekeeper is halted', async () => {
    await networkService
      .setGatekeeperState(networkAuthority.publicKey, GatekeeperState.Halted)
      .rpc();

    return expect(
      gatekeeperService
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
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidState/);
  });

  it('Cannot expire an inactive pass', async () => {
    await gatekeeperService.setState(PassState.Revoked, passAccount).rpc();

    return expect(
      gatekeeperService
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
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it('Cannot expire an expired pass', async () => {
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
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });
});
