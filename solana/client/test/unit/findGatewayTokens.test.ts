import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import { clusterApiUrl, Connection, PublicKey, Keypair } from "@solana/web3.js";
import { findGatewayTokens } from "../../src";
import { PROGRAM_ID } from "../../../gatekeeper-lib/src/util/constants";

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
  let getProgramAccountsStub: sinon.SinonStub;
  afterEach(sandbox.restore);
  beforeEach(() => {
    connection = new Connection(clusterApiUrl("devnet"));
    owner = Keypair.generate().publicKey;
    gatekeeperKey = Keypair.generate().publicKey;
    getProgramAccountsStub = sandbox
      .stub(connection, "getProgramAccounts")
      .withArgs(PROGRAM_ID);
  });
  context("with no token accounts found", () => {
    it("with no value in connection call response should return an empty array", async () => {
      getProgramAccountsStub.resolves([]);
      const findGatewayTokensResponse = await findGatewayTokens(
        connection,
        owner,
        gatekeeperKey
      );
      expect(findGatewayTokensResponse).to.deep.eq([]);
    });

    it("with an empty array returned in connection call response should return an empty array", async () => {
      getProgramAccountsStub.resolves([]);
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
          getProgramAccountsStub.resolves([
            getAccountWithState("frozen", owner),
          ]);
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
          getProgramAccountsStub.resolves([
            getAccountWithState("valid", testPubKey),
          ]);
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
            programId: PROGRAM_ID,
          });
        });
      });
    });

    context("with showRevoked true", () => {
      context("with a frozen account", () => {
        it("should return an array with the revoked account marked as inValid false", async () => {
          const testPubKey = Keypair.generate().publicKey;
          getProgramAccountsStub.resolves([
            getAccountWithState("frozen", testPubKey),
          ]);
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
              programId: PROGRAM_ID,
            },
          ]);
        });
      });

      context("with a valid account and a revoked account", () => {
        it("should return an array with the valid and revoked gateway tokens", async () => {
          const testPubKey = Keypair.generate().publicKey;
          const revokedPubKey = Keypair.generate().publicKey;
          getProgramAccountsStub.resolves([
            getAccountWithState("valid", testPubKey),
            getAccountWithState("frozen", revokedPubKey),
          ]);
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
              programId: PROGRAM_ID,
            },
            {
              gatekeeperKey,
              owner,
              isValid: false,
              publicKey: revokedPubKey,
              programId: PROGRAM_ID,
            },
          ]);
        });
      });
    });
  });
});
