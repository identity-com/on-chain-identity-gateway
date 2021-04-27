import { expect } from 'chai';
import * as sinon from 'sinon';
import { findGatewayToken } from '../../src';
import { clusterApiUrl, Connection, PublicKey, Account } from '@solana/web3.js';
import { SinonStub } from 'sinon';

const sandbox = sinon.createSandbox();
const getAccountWithState = (state: string, pubkey: PublicKey) => ({ pubkey, account: { data: { parsed: { info: { state } } } } });
describe('findGatewayToken', () => {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let getParsedTokenAccountsByOwnerStub: SinonStub;
  afterEach(sandbox.restore);
  beforeEach(() => {
    connection = new Connection(clusterApiUrl('devnet'));
    owner = new Account().publicKey;
    gatekeeperKey = new Account().publicKey;
    getParsedTokenAccountsByOwnerStub = sandbox.stub(connection, 'getParsedTokenAccountsByOwner').withArgs(owner,
      {
        mint: gatekeeperKey,
      });
  });
  context('with no token accounts found', () => {
    it('should return null with no value', async () => {
      getParsedTokenAccountsByOwnerStub.resolves({});
      const findGatewayTokenResponse = await findGatewayToken(connection, owner, gatekeeperKey);
      expect(findGatewayTokenResponse).to.eq(null);
    });

    it('should return null with an empty array', async () => {
      getParsedTokenAccountsByOwnerStub.resolves({ value: [] });
      const findGatewayTokenResponse = await findGatewayToken(connection, owner, gatekeeperKey);
      expect(findGatewayTokenResponse).to.eq(null);
    });
  });

  context('with token accounts found', () => {
    context('with a frozen account', () => {
      it('should return null', async () => {
        getParsedTokenAccountsByOwnerStub.resolves({ value: [getAccountWithState('frozen', owner)] });
        const findGatewayTokenResponse = await findGatewayToken(connection, owner, gatekeeperKey);
        expect(findGatewayTokenResponse).to.eq(null);
      });
    });

    context('with a valid account', () => {
      it('should return the public key', async () => {
        const testPubKey = new Account().publicKey;
        getParsedTokenAccountsByOwnerStub.resolves({ value: [getAccountWithState('valid', testPubKey)] });
        const findGatewayTokenResponse = await findGatewayToken(connection, owner, gatekeeperKey);
        expect(findGatewayTokenResponse).to.eq(testPubKey);
      });
    });
  });
});
