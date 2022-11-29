import {
  GatekeeperService,
  PassAccount,
  PassState,
  onGatewayPass,
  findGatewayPass,
} from '@identity.com/gateway-solana-client';
import { TEST_GATEKEEPER, TEST_NETWORK } from '../util/constants';
import chai from 'chai';
import { Keypair } from '@solana/web3.js';
import { createGatekeeperService } from './util';

const expect = chai.expect;

describe('Issue pass', () => {
  let service: GatekeeperService;

  beforeEach(async () => {
    service = await createGatekeeperService();
  });

  it('Issues a pass', async () => {
    const subject = Keypair.generate().publicKey;

    const account = await GatekeeperService.createPassAddress(
      subject,
      TEST_NETWORK
    );

    await service.issue(account, subject).rpc();
    const pass = await service.getPassAccount(subject);

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

    const subject = Keypair.generate().publicKey;

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

    service.issue(account, subject).rpc();

    await heardCreation;

    await service.getConnection().removeAccountChangeListener(subscriptionId);
  });

  it('Finds a gateway token after issue', async () => {
    const subject = Keypair.generate().publicKey;

    const account = await GatekeeperService.createPassAddress(
      subject,
      TEST_NETWORK
    );

    await service.issue(account, subject).rpc();
    const pass = await findGatewayPass(
      service.getConnection(),
      TEST_NETWORK,
      subject
    );

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
