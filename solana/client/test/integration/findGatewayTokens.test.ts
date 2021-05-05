/* eslint-disable mocha/no-skipped-tests */
import { expect } from 'chai';
import { Connection, PublicKey, Account } from '@solana/web3.js';
import axios from 'axios';
import { findGatewayTokens, GatewayToken } from '../../src';
import { gatekeeperServerBaseUrl, civicNetEndpoint, MINT_AUTHORITY_PUBLIC_KEY, wait, nonUsIPOverrideHeaders } from '../support/testSupport';

const chainUpdateDelay = 8000; // minimum delay through trial and error
describe('findGatewayToken integration tests', () => {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let gatewayToken: string;
  before('Create a gatewayToken for the test account', async () => {
    connection = new Connection(civicNetEndpoint);
    owner = new Account().publicKey;
    gatekeeperKey = new PublicKey(MINT_AUTHORITY_PUBLIC_KEY);
    console.log('gatekeeperKey', gatekeeperKey.toBase58());
    const gatewayTokenResponse = await axios.post(`${gatekeeperServerBaseUrl}`,
      { address: owner.toBase58() },
      { headers: nonUsIPOverrideHeaders },
    );
    ({ token: gatewayToken } = gatewayTokenResponse.data);
    await wait(chainUpdateDelay, `gatewayToken ${gatewayToken} created, waiting ${chainUpdateDelay}ms for the chain to update...`);
  });

  context('with a valid account', () => {
    it('should return the public key', async () => {
      const findGatewayTokenResponse = await findGatewayTokens(connection, owner, gatekeeperKey);
      expect(findGatewayTokenResponse[0].publicKey.toBase58()).to.eq(gatewayToken);
    });
  });

  context('with no token accounts found', () => {
    it('should return an empty array', async () => {
      const findGatewayTokenResponse = await findGatewayTokens(connection, new Account().publicKey, gatekeeperKey);
      expect(findGatewayTokenResponse).to.deep.eq([]);
    });
  });

  context('with token accounts found', () => {
    context('with a frozen account', () => {
      let revokedToken: GatewayToken;
      beforeEach('revoke the test account gatewayToken', async () => {
        ([revokedToken] = await findGatewayTokens(connection, owner, gatekeeperKey));
        console.log('freezing token', revokedToken.publicKey.toBase58());
        await axios.delete(`${gatekeeperServerBaseUrl}/${revokedToken.publicKey.toBase58()}`);
        await wait(chainUpdateDelay, `token frozen, waiting ${chainUpdateDelay}ms for the chain to update...`);
      });
      it('should return an empty array', async () => {
        const findGatewayTokenResponse = await findGatewayTokens(connection, owner, gatekeeperKey);
        expect(findGatewayTokenResponse).to.deep.eq([]);
      });
    });
  });
});
