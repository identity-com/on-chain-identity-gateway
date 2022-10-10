import {PassState} from '../../src/lib/wrappers';
import {createGatekeeperService} from './util';
import {GatekeeperService} from '../../src/GatekeeperService';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {Keypair, PublicKey} from '@solana/web3.js';
import {TEST_NETWORK} from '../util/constants';

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
        await service.expirePass(account, subject).rpc();
        const updatedPass = await service.getPassAccount(subject);

        expect(updatedPass.issueTime).to.be.lt(0);
    });

    it('Cannot expire an inactive pass', async () => {
        await service.setState(PassState.Revoked, account, subject).rpc();

        expect(service.expirePass(account, subject).rpc()).to.eventually.be.rejectedWith(/InvalidPass/);
    });

    it('Cannot expire an expired pass', async () => {
        await service.expirePass(account, subject).rpc();

        expect(service.expirePass(account, subject).rpc()).to.eventually.be.rejectedWith(/InvalidPass/);
    });
});
