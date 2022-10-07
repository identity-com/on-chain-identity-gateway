import { PassState } from '../../src/lib/wrappers';
import { createGatekeeperService } from './util';
import { GatekeeperService } from '../../src/GatekeeperService';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TEST_NETWORK } from '../util/constants';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Refresh a pass', () => {
  let service: GatekeeperService;
  let subject: PublicKey;
  let account: PublicKey;

  beforeEach(async () => {
    service = await createGatekeeperService();

    subject = Keypair.generate().publicKey;
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

    await service.issue(account, subject).rpc();
  });

  it('Refreshes a pass', async () => {
    const initialPass = await service.getPassAccount(subject);

    // Sleep a bit so the expiry time passes
    await new Promise((r) => setTimeout(r, 2000));

    await service.refreshPass(account, subject).rpc();

    const updatedPass = await service.getPassAccount(subject);

    expect(initialPass?.issueTime).to.be.lt(updatedPass?.issueTime as number);
  });

  it('Cannot refresh a frozen pass', async () => {
    await service.setState(PassState.Frozen, account, subject).rpc();
    return expect(service.refreshPass(account, subject).rpc()).to.eventually.be
      .rejected;
  });

  it('Cannot refresh a revoked pass', async () => {
    await service.setState(PassState.Revoked, account, subject).rpc();
    return expect(service.refreshPass(account, subject).rpc()).to.eventually.be
      .rejected;
  });
});
