import {
  AdminService,
  GatekeeperKeyFlags,
  GatekeeperService,
  GatekeeperState,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import { setGatekeeperFlagsAndFees } from '../util/lib';
import {
  makeAssociatedTokenAccountsForIssue,
  setUpAdminNetworkGatekeeper,
} from '../test-set-up';
import * as anchor from '@coral-xyz/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { Account, TOKEN_PROGRAM_ID } from '@solana/spl-token';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Change pass gatekeeper', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let networkService: NetworkService;
  let gatekeeperService: GatekeeperService;
  let adminService: AdminService;

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
  let funderKeypair: Keypair;
  let gatekeeperAta: Account;
  let networkAta: Account;
  let funderAta: Account;

  beforeEach(async () => {
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
      adminService,
    } = await setUpAdminNetworkGatekeeper(program, programProvider));
    ({ gatekeeperAta, networkAta, funderAta, funderKeypair } =
      await makeAssociatedTokenAccountsForIssue(
        programProvider.connection,
        adminAuthority,
        mintAuthority,
        networkAuthority.publicKey,
        gatekeeperAuthority.publicKey,
        mintAccount.publicKey,
        gatekeeperPDA
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

  it('Cannot change a pass in a halted gatekeeper', async () => {
    // Assemble
    const dataAcct = networkService.getGatekeeperAddress();
    await setGatekeeperFlagsAndFees(
      stakingPDA,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER
    );

    await networkService
      .setGatekeeperState(GatekeeperState.Halted)
      .withPartialSigners(networkAuthority)
      .rpc();

    // Act
    return expect(
      gatekeeperService.changePassGatekeeper(dataAcct, passAccount).rpc()
    ).to.eventually.be.rejectedWith(/InvalidState/);
  });

  it('Can change a pass in a frozen gatekeeper', async () => {
    // Assemble
    const dataAcct = networkService.getGatekeeperAddress();
    await setGatekeeperFlagsAndFees(
      stakingPDA,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER
    );

    await networkService
      .setGatekeeperState(GatekeeperState.Frozen)
      .withPartialSigners(networkAuthority)
      .rpc();

    // Act
    await gatekeeperService.changePassGatekeeper(dataAcct, passAccount).rpc();
  });

  it('Cannot change gatekeepers if the network feature is not enabled', async () => {
    const network = await adminService.getNetworkAccount();
    if (!network) throw new Error('Network not found');

    await adminService
      .updateNetwork({
        authThreshold: network.authThreshold,
        authKeys: { add: [], remove: [] },
        fees: { add: [], remove: [] },
        passExpireTime: network.passExpireTime,
        supportedTokens: { add: [], remove: [] },
        networkFeatures: 0, // remove all features
      })
      .rpc();

    const dataAcct = networkService.getGatekeeperAddress();
    await setGatekeeperFlagsAndFees(
      stakingPDA,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER
    );

    return expect(
      gatekeeperService.changePassGatekeeper(dataAcct, passAccount).rpc()
    ).to.eventually.be.rejectedWith(/UnsupportedNetworkFeature/);
  });

  it('Cannot change to gatekeeper within a different network', async () => {
    // Assemble
    const { gatekeeperPDA } = await setUpAdminNetworkGatekeeper(
      program,
      programProvider
    );

    expect(
      gatekeeperService.changePassGatekeeper(gatekeeperPDA, passAccount).rpc()
    ).to.eventually.be.rejectedWith(/InvalidNetwork/);
  });
});
