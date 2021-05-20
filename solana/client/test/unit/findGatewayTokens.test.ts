import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import { clusterApiUrl, Connection, PublicKey, Keypair } from "@solana/web3.js";
import { findGatewayTokens } from "../../src";
import { PROGRAM_ID } from "../../../gatekeeper-lib/src/util/constants";
import {
  Frozen,
  Active,
  GatewayTokenData,
  GatewayTokenState,
} from "../../src/solana/GatewayTokenData";
import { AssignablePublicKey } from "../../src/solana/AssignablePublicKey";

chai.use(chaiSubset);
const { expect } = chai;
const sandbox = sinon.createSandbox();
const getAccountWithState = (
  state: GatewayTokenState,
  pubkey: PublicKey,
  ownerKey: PublicKey,
  gatekeeperKey: PublicKey
) => {
  const gtData = new GatewayTokenData({
    state,
    owner: AssignablePublicKey.fromPublicKey(ownerKey),
    issuingGatekeeper: AssignablePublicKey.fromPublicKey(gatekeeperKey),
    gatekeeperNetwork: AssignablePublicKey.fromPublicKey(gatekeeperKey),
    features: [0],
    parentGatewayToken: [0],
    ownerIdentity: [0],
    expiry: [0],
  });
  return { pubkey, account: { data: gtData.encode() } };
};

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
            getAccountWithState(
              new GatewayTokenState({ frozen: new Frozen({}) }),
              owner,
              owner,
              gatekeeperKey
            ),
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
            getAccountWithState(
              new GatewayTokenState({ active: new Active({}) }),
              testPubKey,
              owner,
              gatekeeperKey
            ),
          ]);
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperKey
          );
          expect(findGatewayTokensResponse.length).to.deep.eq(1);
          expect(findGatewayTokensResponse[0]).to.deep.eq({
            issuingGatekeeper: gatekeeperKey,
            gatekeeperNetwork: gatekeeperKey,
            owner,
            isValid: true,
            programId: new PublicKey(PROGRAM_ID.toBase58()), // Key has to be re-constructed here for deep.eq to work.
            publicKey: testPubKey,
          });
        });
      });
    });

    context("with showRevoked true", () => {
      context("with a frozen account", () => {
        it("should return an array with the revoked account marked as isValid false", async () => {
          const testPubKey = Keypair.generate().publicKey;
          getProgramAccountsStub.resolves([
            getAccountWithState(
              new GatewayTokenState({ frozen: new Frozen({}) }),
              testPubKey,
              owner,
              gatekeeperKey
            ),
          ]);
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperKey,
            true
          );
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperNetwork: gatekeeperKey,
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
            getAccountWithState(
              new GatewayTokenState({ active: new Active({}) }),
              testPubKey,
              owner,
              gatekeeperKey
            ),
            getAccountWithState(
              new GatewayTokenState({ frozen: new Frozen({}) }),
              revokedPubKey,
              owner,
              gatekeeperKey
            ),
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
              gatekeeperNetwork: gatekeeperKey,
              issuingGatekeeper: gatekeeperKey,
              owner,
              isValid: true,
              publicKey: testPubKey,
              programId: PROGRAM_ID,
            },
            {
              gatekeeperNetwork: gatekeeperKey,
              issuingGatekeeper: gatekeeperKey,
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
