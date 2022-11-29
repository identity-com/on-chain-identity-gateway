import { createNetworkService } from './util';
import {
  GatekeeperService,
  NetworkService,
  GatekeeperKeyFlags,
  AdminService,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import { setGatekeeperFlagsAndFees } from '../util/lib';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Change pass gatekeeper', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let networkService: NetworkService;
  let gatekeeperService: GatekeeperService;

  let gatekeeperPDA: PublicKey;
  let stakingPDA: PublicKey;
  let passAccount: PublicKey;
  let mint: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;
  let mintAuthority: Keypair;
  let subject: Keypair;
  let mintAccount: Keypair;

  before(async () => {
    ({
      networkService,
      gatekeeperService,
      gatekeeperPDA,
      stakingPDA,
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

  it('Can change to gatekeeper within the same network', async () => {
    // Assemble
    const dataAcct = networkService.getGatekeeperAddress();
    await setGatekeeperFlagsAndFees(
      stakingPDA,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER
    );

    // Act
    await gatekeeperService.changePassGatekeeper(dataAcct, passAccount).rpc();

    const pass = await gatekeeperService.getPassAccount(subject.publicKey);
    const newDataAcct = networkService.getGatekeeperAddress()?.toBase58();

    // Assert
    expect(pass?.gatekeeper.toBase58()).to.equal(newDataAcct);
  });

  it.skip('Cannot change to gatekeeper within a different network', async () => {
    // Assemble
    const atlNetworkAuthority = Keypair.generate();
    const [altStakingAccount] = await NetworkService.createStakingAddress(
      atlNetworkAuthority.publicKey
    );
    const altNetworkService = await createNetworkService(
      Keypair.generate(),
      atlNetworkAuthority.publicKey
    );
    await altNetworkService
      .createGatekeeper(atlNetworkAuthority.publicKey, altStakingAccount)
      .rpc();
    console.log('adsfadsfadsf', altNetworkService.getGatekeeperAddress());
    // Act + Assert
    return expect(
      gatekeeperService
        .changePassGatekeeper(
          altNetworkService.getGatekeeperAddress(),
          passAccount
        )
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidNetwork/);
  });
});
