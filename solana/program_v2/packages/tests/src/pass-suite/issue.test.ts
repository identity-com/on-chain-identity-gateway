import {
  GatekeeperService,
  PassAccount,
  PassState,
  onGatewayPass,
  findGatewayPass,
  airdrop,
} from '@identity.com/gateway-solana-client';
import {
  TEST_GATEKEEPER,
  TEST_GATEKEEPER_AUTHORITY,
  TEST_MINT,
  TEST_NETWORK,
} from '../util/constants';
import chai from 'chai';
import { Keypair, PublicKey, Signer } from '@solana/web3.js';
import { createGatekeeperService } from './util';
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Account } from '@solana/spl-token/src/state/account';

const expect = chai.expect;

describe.only('Issue pass', () => {
  let service: GatekeeperService;
  let account: PublicKey;
  let network: Account;
  let gatekeeper: Account;
  let funder: Account;

  const subject = Keypair.generate().publicKey;
  const signer: Signer = Keypair.generate();

  beforeEach(async () => {
    service = await createGatekeeperService();
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);
    await airdrop(service.getConnection(), signer.publicKey);

    network = await getOrCreateAssociatedTokenAccount(
      service.getConnection(),
      signer,
      TEST_MINT,
      TEST_NETWORK,
      true
    );
    gatekeeper = await getOrCreateAssociatedTokenAccount(
      service.getConnection(),
      signer,
      TEST_MINT,
      TEST_GATEKEEPER,
      true
    );
    funder = await getOrCreateAssociatedTokenAccount(
      service.getConnection(),
      signer,
      TEST_MINT,
      TEST_GATEKEEPER_AUTHORITY,
      true
    );
  });

  it.only('Issues a pass', async () => {
    // Act
    await service
      .issue(
        account,
        subject,
        TOKEN_PROGRAM_ID,
        TEST_MINT,
        gatekeeper.address,
        network.address,
        funder.address
      )
      .rpc();
    const pass = await service.getPassAccount(subject);

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject,
      network: TEST_NETWORK,
      gatekeeper: TEST_GATEKEEPER,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });

  it('listens for a gateway pass to be created', async () => {
    // The promise will resolve when the token is created
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let heardCreationCallback: (pass: PassAccount) => void = () => {};

    const heardCreation = new Promise((resolve) => {
      heardCreationCallback = resolve;
    });

    const subscriptionId = await onGatewayPass(
      service.getConnection(),
      TEST_NETWORK,
      subject,
      0,
      heardCreationCallback
    );

    const account = await GatekeeperService.createPassAddress(
      subject,
      TEST_NETWORK
    );

    service
      .issue(
        account,
        subject,
        TEST_MINT,
        TEST_MINT,
        gatekeeper.address,
        network.address,
        funder.address
      )
      .rpc();

    await heardCreation;

    await service.getConnection().removeAccountChangeListener(subscriptionId);
  });

  it('Finds a gateway token after issue', async () => {
    // Assemble
    await service
      .issue(
        account,
        subject,
        TEST_MINT,
        TEST_MINT,
        gatekeeper.address,
        network.address,
        funder.address
      )
      .rpc();

    // Act
    const pass = await findGatewayPass(
      service.getConnection(),
      TEST_NETWORK,
      subject
    );

    // Assert
    expect(pass).to.deep.include({
      version: 0,
      subject,
      network: TEST_NETWORK,
      gatekeeper: TEST_GATEKEEPER,
      state: PassState.Active,
    });

    // CHECK: that the issueTime is recent (is this best?)
    expect(pass?.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
    expect(pass?.issueTime).to.be.lessThan(new Date().getTime() + 5000);
  });
});
