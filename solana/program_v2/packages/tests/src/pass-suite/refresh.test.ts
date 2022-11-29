import {
  PassAccount,
  PassState,
  GatekeeperService,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Refresh a pass', () => {
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

  it('Refreshes a pass', async () => {
    const initialPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

    // Sleep a bit so the expiry time passes
    await new Promise((r) => setTimeout(r, 2000));

    await gatekeeperService.refreshPass(passAccount).rpc();

    const updatedPass = await gatekeeperService.getPassAccount(
      subject.publicKey
    );

    expect(initialPass?.issueTime).to.be.lt(
      (updatedPass as PassAccount).issueTime
    );
  });

  it('Cannot refresh a frozen pass', async () => {
    await gatekeeperService.setState(PassState.Frozen, passAccount).rpc();
    return expect(gatekeeperService.refreshPass(passAccount).rpc()).to
      .eventually.be.rejected;
  });

  it('Cannot refresh a revoked pass', async () => {
    await gatekeeperService.setState(PassState.Revoked, passAccount).rpc();
    return expect(gatekeeperService.refreshPass(passAccount).rpc()).to
      .eventually.be.rejected;
  });
});
