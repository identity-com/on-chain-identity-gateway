import chai from 'chai';
import { Account, PublicKey } from '@solana/web3.js';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import chaiSubset from 'chai-subset';
import { GatekeeperClient, GatekeeperRecord } from '../../src';
import { baseUrl } from '../../test/support/testSupport';

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiSubset);
const { expect } = chai;

const expectCreatedGatekeeperRecord = (gatekeeperRecord: GatekeeperRecord) => {
  expect(gatekeeperRecord.approved).to.eq(true);
  expect(gatekeeperRecord.country).to.be.a('string');
  expect(gatekeeperRecord.ipAddress).to.be.a('string');
  expect(gatekeeperRecord.name).to.be.a('string');
  expect(gatekeeperRecord.timestamp).to.be.a('string');
  expect(gatekeeperRecord.token).to.be.a('string');
};

describe('GatekeeperClient', () => {
  let gatekeeperClientInst:GatekeeperClient;
  let walletPublicKey: PublicKey;

  beforeEach(() => {
    walletPublicKey = new Account().publicKey;
    gatekeeperClientInst = new GatekeeperClient({ baseUrl });
  });
  context('createGatewayToken', () => {
    context('with a valid walletPublicKey passed', () => {
      it('should retrieve a gatekeeper record', async () => {
        const gatekeeperRecord = await gatekeeperClientInst.createGatewayToken(walletPublicKey);
        expectCreatedGatekeeperRecord(gatekeeperRecord);
      });
    });

    context('with an error', () => {
      context('with a server response not 2xx', () => {
        it('should throw an error with server message for a 500 response', () => {
          const badWalletPublicKey = { toBase58: () => 'bad public key' };
          return expect(gatekeeperClientInst.createGatewayToken(badWalletPublicKey as PublicKey))
            .rejectedWith('Non-base58 character');
        });
      });
    });
  });

  context('auditGatewayToken', () => {
    let gatekeeperClientInst:GatekeeperClient;
    let gatewayToken;
    beforeEach(async () => {
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    context('with a good token', () => {
      beforeEach(async () => {
        ({ token: gatewayToken } = await gatekeeperClientInst.createGatewayToken(walletPublicKey));
      });

      it('should do a server lookup using the token in the path', async () => {
        const auditResponse: GatekeeperRecord = await gatekeeperClientInst.auditGatewayToken(gatewayToken);
        expectCreatedGatekeeperRecord(auditResponse);
      });
    });

    context('with a bad token', () => {
      const token = 'error_token';
      it('should throw an error with server message for a 500 response', () => {
        return expect(gatekeeperClientInst.auditGatewayToken(token))
          .rejectedWith('Non-base58 character');
      });
    });

    context('for a token not created by the gatekeeper', () => {
      it('should throw an error with server message for a 500 response', () => {
        return expect(gatekeeperClientInst.auditGatewayToken(new Account().publicKey.toBase58()))
          .rejectedWith('NoSuchKey');
      });
    });
  });

  context('requestAirdrop', () => {
    let gatekeeperClientInst:GatekeeperClient;

    beforeEach(() => {
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it('should make a server POST request using the wallet public key', async () => {
      const requestAirdropResponse = await gatekeeperClientInst.requestAirdrop(walletPublicKey);
      expect(requestAirdropResponse).to.eq(undefined);
    });
  });
});
