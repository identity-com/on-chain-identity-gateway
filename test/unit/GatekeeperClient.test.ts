import { GatekeeperClient, GatekeeperClientConfig } from "../../src";
import { expect } from 'chai';
import * as fetchMock from 'fetch-mock';
import { Account, PublicKey } from "@solana/web3.js";

describe('GatekeeperClient', () => {
  context('constructor', () => {
    it('should throw an error if no config is provided', () => {
      expect(() => new GatekeeperClient({} as GatekeeperClientConfig)).to.throw('No valid config provided');
    });

    it('should add config as an instance variable', () => {
      const baseUrl = 'test_baseUrl';
      const clientInst = new GatekeeperClient({ baseUrl });
      expect(clientInst.config).to.deep.eq({ baseUrl });
    });
  });

  context('baseUrl', () => {
    it('should return the config baseUrl', () => {
      const baseUrl = 'test_baseUrl';
      const clientInst = new GatekeeperClient({ baseUrl });
      expect(clientInst.baseUrl).to.eq(baseUrl);
    });
  });

  context('createGatewayToken', () => {
    let gatekeeperClientInst:GatekeeperClient;
    let baseUrl: string;
    let walletPublicKey: PublicKey;
    beforeEach(() => {
      walletPublicKey = new Account().publicKey;
      baseUrl = 'test_baseUrl';
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    })
    context('with only the walletPublicKey passed', () => {
      it('should call fetch with an address param', async () => {
        const myMock = fetchMock.sandbox().mock(baseUrl, 200);
        await gatekeeperClientInst.createGatewayToken(walletPublicKey);
        expect(myMock.called(baseUrl)).to.be.true;
      })
    });
  });
});