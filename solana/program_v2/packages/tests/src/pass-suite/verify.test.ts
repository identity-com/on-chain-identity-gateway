import {
  airdrop,
  GatekeeperService,
  NetworkService,
  PassState,
} from '@identity.com/gateway-solana-client';
import { createGatekeeperService } from './util';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import { Account, AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Verify a pass', () => {
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
    expect(funderAccount.amount).to.equal(1000n);
    expect(networkAccount.amount).to.equal(2n);
    expect(gatekeeperAccount.amount).to.equal(1998n);
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

  it.only('Fails to verify a pass in a different network', async () => {
    const auth = Keypair.generate();
    const network = Keypair.generate();
    const wallet = new anchor.Wallet(funderKeypair);

    await airdrop(
      programProvider.connection,
      auth.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    await airdrop(
      programProvider.connection,
      network.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const altService = await GatekeeperService.buildFromAnchor(
      program,
      network.publicKey,
      funderKeypair.publicKey,
      {
        clusterType: 'localnet',
        wallet: wallet,
      },
      programProvider
    );
    console.log(altService);

    return expect(
      altService
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
    ).to.eventually.be.rejectedWith(/A seeds constraint was violated/);
  });
});
