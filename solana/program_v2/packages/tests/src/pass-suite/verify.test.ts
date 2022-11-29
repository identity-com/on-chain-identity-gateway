import {
  PassState,
  GatekeeperService,
} from '@identity.com/gateway-solana-client';
import { createGatekeeperService } from './util';
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

  it('Verifies a valid pass', async () => {
    await gatekeeperService.verifyPass(passAccount).rpc();
  });

  it('Fails to verify an expired pass', async () => {
    await gatekeeperService.expirePass(passAccount).rpc();

    return expect(
      gatekeeperService.verifyPass(passAccount).rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it('Fails to verify an inactive pass', async () => {
    await gatekeeperService.setState(PassState.Revoked, passAccount).rpc();

    expect(
      gatekeeperService.verifyPass(passAccount).rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it.skip('Fails to verify a pass in a different network', async () => {
    const auth = Keypair.generate();
    const network = Keypair.generate();
    const altService = await createGatekeeperService(
      auth.publicKey,
      network.publicKey
    );

    return expect(
      altService.verifyPass(passAccount).rpc()
    ).to.eventually.be.rejectedWith(/A seeds constraint was violated/);
  });
});
