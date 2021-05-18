import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import { clusterApiUrl, Connection, PublicKey, Keypair } from "@solana/web3.js";
import { findGatewayTokens, TOKEN_PROGRAM_ID } from "../../src";

chai.use(chaiSubset);
const { expect } = chai;
const sandbox = sinon.createSandbox();
const getAccountWithState = (state: string, pubkey: PublicKey) => ({
  pubkey,
  account: { data: { parsed: { info: { state } } } },
});
describe("findGatewayTokens", () => {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let getParsedTokenAccountsByOwnerStub: sinon.SinonStub;
  afterEach(sandbox.restore);
  beforeEach(() => {
    connection = new Connection(clusterApiUrl("devnet"));
    owner = Keypair.generate().publicKey;
    gatekeeperKey = Keypair.generate().publicKey;
    getParsedTokenAccountsByOwnerStub = sandbox
      .stub(connection, "getParsedTokenAccountsByOwner")
      .withArgs(owner, {
        mint: gatekeeperKey,
      });
  });
  context("with no token accounts found", () => {
    it("with no value in connection call response should return an empty array", async () => {
      getParsedTokenAccountsByOwnerStub.resolves({});
      const findGatewayTokensResponse = await findGatewayTokens(
        connection,
        owner,
        gatekeeperKey
      );
      expect(findGatewayTokensResponse).to.deep.eq([]);
    });

    it("with an empty array returned in connection call response should return an empty array", async () => {
      getParsedTokenAccountsByOwnerStub.resolves({ value: [] });
      const findGatewayTokensResponse = await findGatewayTokens(
        connection,
        owner,
        gatekeeperKey
      );
      expect(findGatewayTokensResponse).to.deep.eq([]);
    });
  });

  context("with token accounts found", () => {
    context("with showRevoked false", () => {
      context("with a frozen account", () => {
        it("should return an empty array", async () => {
          getParsedTokenAccountsByOwnerStub.resolves({
            value: [getAccountWithState("frozen", owner)],
          });
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperKey
          );
          expect(findGatewayTokensResponse).to.deep.eq([]);
        });
      });

      context("with a valid account", () => {
        it("should return an array with a gateway token", async () => {
          const testPubKey = Keypair.generate().publicKey;
          getParsedTokenAccountsByOwnerStub.resolves({
            value: [getAccountWithState("valid", testPubKey)],
          });
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperKey
          );
          expect(findGatewayTokensResponse.length).to.deep.eq(1);
          expect(findGatewayTokensResponse[0]).to.deep.eq({
            gatekeeperKey,
            owner,
            isValid: true,
            publicKey: testPubKey,
            programId: TOKEN_PROGRAM_ID,
          });
        });
      });
    });

    context("with showRevoked true", () => {
      context("with a frozen account", () => {
        it("should return an array with the revoked account marked as inValid false", async () => {
          const testPubKey = Keypair.generate().publicKey;
          getParsedTokenAccountsByOwnerStub.resolves({
            value: [getAccountWithState("frozen", testPubKey)],
          });
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperKey,
            true
          );
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperKey,
              owner,
              isValid: false,
              publicKey: testPubKey,
              programId: TOKEN_PROGRAM_ID,
            },
          ]);
        });
      });

      context("with a valid account and a revoked account", () => {
        it("should return an array with the valid and revoked gateway tokens", async () => {
          const testPubKey = Keypair.generate().publicKey;
          const revokedPubKey = Keypair.generate().publicKey;
          getParsedTokenAccountsByOwnerStub.resolves({
            value: [
              getAccountWithState("valid", testPubKey),
              getAccountWithState("frozen", revokedPubKey),
            ],
          });
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperKey,
            true
          );
          expect(findGatewayTokensResponse.length).to.eq(2);
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperKey,
              owner,
              isValid: true,
              publicKey: testPubKey,
              programId: TOKEN_PROGRAM_ID,
            },
            {
              gatekeeperKey,
              owner,
              isValid: false,
              publicKey: revokedPubKey,
              programId: TOKEN_PROGRAM_ID,
            },
          ]);
        });
      });
    });
  });
});
