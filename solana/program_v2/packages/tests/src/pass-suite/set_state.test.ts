import {
  PassState,
  GatekeeperService,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Change pass state', () => {
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
    const { gatekeeperAta, networkAta, funderAta, funderKeypair } =
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
        networkAta.address,
        gatekeeperAta.address,
        funderAta.address,
        funderKeypair.publicKey
      )
      .withPartialSigners(funderKeypair)
      .rpc();
  });

  const changeState = async (from: PassState, to: PassState) => {
    if (from !== PassState.Active) {
      // initial state is already Active
      await gatekeeperService.setState(from, passAccount).rpc();
    }

    await gatekeeperService.setState(to, passAccount).rpc();
  };

  it('Cannot activate an active pass', async () => {
    return expect(
      changeState(PassState.Active, PassState.Active)
    ).to.eventually.be.rejectedWith(/InvalidStateChange/);
  });

  it('Can activate a frozen pass', async () => {
    return expect(changeState(PassState.Frozen, PassState.Active)).to.eventually
      .be.fulfilled;
  });

  it('Cannot activate a revoked pass', async () => {
    return expect(
      changeState(PassState.Revoked, PassState.Active)
    ).to.eventually.be.rejectedWith(/InvalidStateChange/);
  });

  it('Can freeze an active pass', async () => {
    return expect(changeState(PassState.Active, PassState.Frozen)).to.eventually
      .be.fulfilled;
  });

  it('Cannot freeze a frozen token', async () => {
    return expect(
      changeState(PassState.Frozen, PassState.Frozen)
    ).to.eventually.be.rejectedWith(/InvalidStateChange/);
  });

  it('Cannot freeze a revoked token', async () => {
    return expect(
      changeState(PassState.Revoked, PassState.Frozen)
    ).to.eventually.be.rejectedWith(/InvalidStateChange/);
  });

  it('Can revoke an active pass', async () => {
    return expect(changeState(PassState.Active, PassState.Revoked)).to
      .eventually.be.fulfilled;
  });

  it('Can revoke a frozen token', async () => {
    return expect(changeState(PassState.Frozen, PassState.Revoked)).to
      .eventually.be.fulfilled;
  });

  it('Cannot revoke a revoked token', async () => {
    return expect(
      changeState(PassState.Revoked, PassState.Revoked)
    ).to.eventually.be.rejectedWith(/InvalidStateChange/);
  });
});
