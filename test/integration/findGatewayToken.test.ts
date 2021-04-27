import { expect } from 'chai';
import { Connection, PublicKey, Account } from '@solana/web3.js';
import axios from 'axios';
import { findGatewayToken } from '../../src';
import { baseUrl, civicNetEndpoint, MINT_AUTHORITY_PUBLIC_KEY, wait } from '../../test/support/testSupport';

const chainUpdateDelay = 8000; // minimum delay through trial and error
describe('findGatewayToken integration tests', () => {
  let connection: Connection;
  let owner: PublicKey;
  let mintAuthorityPublicKey: PublicKey;
  let gatewayToken: string;
  before('Create a gatewayToken for the test account', async () => {
    connection = new Connection(civicNetEndpoint);
    owner = new Account().publicKey;
    mintAuthorityPublicKey = new PublicKey(MINT_AUTHORITY_PUBLIC_KEY);
    console.log('gatekeeperKey', mintAuthorityPublicKey.toBase58());
    const gatewayTokenResponse = await axios.post(`${baseUrl}`, { address: owner.toBase58() });
    ({ token: gatewayToken } = gatewayTokenResponse.data);
    console.log('newly created gatewayToken', gatewayToken);
    console.log(`waiting ${chainUpdateDelay}ms for the chain to update...`);
    await wait(chainUpdateDelay);
  });

  context('with a valid account', () => {
    it('should return the public key', async () => {
      const findGatewayTokenResponse = await findGatewayToken(connection, owner, mintAuthorityPublicKey);
      expect(findGatewayTokenResponse).to.deep.eq(new PublicKey(gatewayToken));
    });
  });

  context('with no token accounts found', () => {
    it('should return null', async () => {
      const findGatewayTokenResponse = await findGatewayToken(connection, new Account().publicKey, mintAuthorityPublicKey);
      expect(findGatewayTokenResponse).to.eq(null);
    });
  });

  context('with token accounts found', () => {
    context('with a frozen account', () => {
      let revokedToken;
      beforeEach('revoke the test account gatewayToken', async () => {
        revokedToken = await findGatewayToken(connection, owner, mintAuthorityPublicKey);
        await axios.delete(`${baseUrl}/${revokedToken}`);
        await wait(chainUpdateDelay);
      });
      it('should return null', async () => {
        const findGatewayTokenResponse = await findGatewayToken(connection, owner, mintAuthorityPublicKey);
        expect(findGatewayTokenResponse).to.eq(null);
      });
    });
  });
});
