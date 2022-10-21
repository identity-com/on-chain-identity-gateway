import { PassState } from '@identity.com/gateway-solana-client';
import { createGatekeeperService } from './util';
import { GatekeeperService } from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TEST_NETWORK } from '../util/constants';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Expire a pass', () => {
  let service: GatekeeperService;
  let subject: PublicKey;
  let account: PublicKey;

  beforeEach(async () => {
    service = await createGatekeeperService();

    subject = Keypair.generate().publicKey;
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

    await service.issue(account, subject).rpc();
  });

  it('Expires a pass', async () => {
    await service.expirePass(account).rpc();
    const updatedPass = await service.getPassAccount(subject);

    expect(updatedPass?.issueTime).to.be.lt(0);
  });

  it('Cannot expire an inactive pass', async () => {
    await service.setState(PassState.Revoked, account).rpc();

    expect(service.expirePass(account).rpc()).to.eventually.be.rejectedWith(
      /InvalidPass/
    );
  });

  it('Cannot expire an expired pass', async () => {
    await service.expirePass(account).rpc();

    expect(service.expirePass(account).rpc()).to.eventually.be.rejectedWith(
      /InvalidPass/
    );
  });
});
