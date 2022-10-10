import { PassState } from '../../src/lib/wrappers';
import { createGatekeeperService, createNetworkService } from './util';
import { GatekeeperService } from '../../src/GatekeeperService';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkService } from '../../src/NetworkService';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TEST_ALT_NETWORK, TEST_NETWORK } from '../util/constants';
import { setGatekeeperFlags } from '../util/lib';
import { GatekeeperKeyFlags } from '../../src/lib/constants';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Change pass gatekeeper', () => {
  let service: GatekeeperService;
  let subject: PublicKey;
  let account: PublicKey;

  beforeEach(async () => {
    service = await createGatekeeperService();

    subject = Keypair.generate().publicKey;
    account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

    await service.issue(account, subject).rpc();
  });

  it('Can change to gatekeeper within the same network', async () => {
    const [stakingAccount] = await NetworkService.createStakingAddress(
      TEST_NETWORK
    );
    const networkService = await createNetworkService(Keypair.generate());
    await networkService.createGatekeeper(TEST_NETWORK, stakingAccount).rpc();
    const dataAcct = networkService.getDataAccount();

    await setGatekeeperFlags(
      stakingAccount,
      networkService,
      GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER
    );

    await service.changePassGatekeeper(dataAcct, account).rpc();

    const pass = await service.getPassAccount(subject);
    const newDataAcct = networkService.getDataAccount()?.toBase58();

    expect(pass?.gatekeeper.toBase58()).to.equal(newDataAcct);
  });

  it('Cannot change to gatekeeper within a different network', async () => {
    const [stakingAccount] = await NetworkService.createStakingAddress(
      TEST_ALT_NETWORK
    );

    const networkService = await createNetworkService(
      Keypair.generate(),
      TEST_ALT_NETWORK
    );
    await networkService
      .createGatekeeper(TEST_ALT_NETWORK, stakingAccount)
      .rpc();

    return expect(
      service
        .changePassGatekeeper(networkService.getDataAccount(), account)
        .rpc()
    ).to.eventually.be.rejectedWith(/InvalidNetwork/);
  });
});
