import {
  GatekeeperService,
  PassState,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Expire a pass', () => {
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
  });

  it('Expires a pass', async () => {
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
      .expirePass(
        passAccount,
        TOKEN_PROGRAM_ID,
        mint,
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc();
    const updatedPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

    expect(updatedPass?.issueTime).to.be.lt(0);
  });

  it('Cannot expire an inactive pass', async () => {
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

    await gatekeeperService.setState(PassState.Revoked, passAccount).rpc();

    return expect(
      gatekeeperService
        .expirePass(
          passAccount,
          TOKEN_PROGRAM_ID,
          mint,
          gatekeeperAta.address,
          networkAta.address,
          funderAta.address
        )
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it('Cannot expire an expired pass', async () => {
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
      .expirePass(
        passAccount,
        TOKEN_PROGRAM_ID,
        mint,
        gatekeeperAta.address,
        networkAta.address,
        funderAta.address
      )
      .rpc();

    return expect(
      gatekeeperService
        .expirePass(
          passAccount,
          TOKEN_PROGRAM_ID,
          mint,
          gatekeeperAta.address,
          networkAta.address,
          funderAta.address
        )
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });
});
