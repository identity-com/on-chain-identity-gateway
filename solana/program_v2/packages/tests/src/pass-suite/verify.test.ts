import {
  PassState,
  GatekeeperService,
} from '@identity.com/gateway-solana-client';
import { createGatekeeperService } from './util';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  TEST_ALT_NETWORK,
  TEST_GATEKEEPER_AUTHORITY,
  TEST_NETWORK,
} from '../util/constants';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe.only('Verify a pass', () => {
  let service: GatekeeperService;
  let subject: PublicKey;
  let account: PublicKey;

  beforeEach(async () => {
    service = await createGatekeeperService();

    subject = Keypair.generate().publicKey;
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

    await service.issue(account, subject).rpc();
  });

  it('Verifies a valid pass', async () => {
    await service.verifyPass(account).rpc();
  });

  it('Fails to verify an expired pass', async () => {
    await service.expirePass(account).rpc();

    return expect(
      service.verifyPass(account).rpc()
    ).to.eventually.be.rejectedWith(/InvalidPass/);
  });

  it('Fails to verify an inactive pass', async () => {
    await service.setState(PassState.Revoked, account).rpc();

    expect(service.verifyPass(account).rpc()).to.eventually.be.rejectedWith(
      /InvalidPass/
    );
  });

  it('Fails to verify a pass in a different network', async () => {
    const altService = await createGatekeeperService(
      TEST_GATEKEEPER_AUTHORITY,
      TEST_ALT_NETWORK
    );

    return expect(
      altService.verifyPass(account).rpc()
    ).to.eventually.be.rejectedWith(/A seeds constraint was violated/);
  });
});
