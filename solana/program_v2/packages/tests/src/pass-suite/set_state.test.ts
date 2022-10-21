import { PassState } from '@identity.com/gateway-solana-client';
import { createGatekeeperService } from './util';
import { GatekeeperService } from '@identity.com/gateway-solana-client';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TEST_NETWORK } from '../util/constants';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Change pass state', () => {
  let service: GatekeeperService;
  let subject: PublicKey;
  let account: PublicKey;

  beforeEach(async () => {
    service = await createGatekeeperService();

    subject = Keypair.generate().publicKey;
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

    await service.issue(account, subject).rpc();
  });

  const changeState = async (from: PassState, to: PassState) => {
    if (from !== PassState.Active) {
      // initial state is already Active
      await service.setState(from, account).rpc();
    }

    await service.setState(to, account).rpc();
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
