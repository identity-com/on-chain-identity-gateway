import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { findAllGatewayTokens, findGatewayTokens, State } from "../../src";
import { PROGRAM_ID } from "../../src/lib/constants";
import {
  Active,
  Revoked,
  GatewayTokenState,
} from "../../src/lib/GatewayTokenData";
import { VALIDATOR_URL } from "../constatnts";
import { describe } from "mocha";
import { getAccountWithState } from "./utils";

chai.use(chaiSubset);
const { expect } = chai;
const sandbox = sinon.createSandbox();

describe("findGatewayTokens", () => {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let gatekeeperNetworkKey: PublicKey;
  let getProgramAccountsStub: sinon.SinonStub;

  beforeEach(() => {
    connection = new Connection(VALIDATOR_URL);
    owner = Keypair.generate().publicKey;
    gatekeeperKey = Keypair.generate().publicKey;
    gatekeeperNetworkKey = Keypair.generate().publicKey;
    getProgramAccountsStub = sandbox
      .stub(connection, "getProgramAccounts")
      .withArgs(PROGRAM_ID);
  });
  afterEach(sandbox.restore);

  context("with no token accounts found", () => {
    it("with no value in connection call response should return an empty array", async () => {
      getProgramAccountsStub.resolves([]);
      const findGatewayTokensResponse = await findGatewayTokens(
        connection,
        owner,
        gatekeeperNetworkKey
      );
      expect(findGatewayTokensResponse).to.deep.equal([]);
    });

    it("with an empty array returned in connection call response should return an empty array", async () => {
      getProgramAccountsStub.resolves([]);
      const findGatewayTokensResponse = await findGatewayTokens(
        connection,
        owner,
        gatekeeperNetworkKey
      );
      expect(findGatewayTokensResponse).to.deep.equal([]);
    });
  });

  context("with token accounts found", () => {
    context("with showRevoked false", () => {
      context("with a revoked account", () => {
        it("should return an empty array", async () => {
          getProgramAccountsStub.resolves([
            getAccountWithState(
              new GatewayTokenState({ revoked: new Revoked({}) }),
              owner,
              owner,
              gatekeeperNetworkKey,
              gatekeeperKey
            ),
          ]);
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperNetworkKey
          );
          expect(findGatewayTokensResponse).to.deep.equal([]);
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
              gatekeeperNetworkKey,
              gatekeeperKey
            ),
          ]);
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperNetworkKey
          );
          expect(findGatewayTokensResponse.length).to.equal(1);
          expect(findGatewayTokensResponse[0]).to.deep.equal({
            issuingGatekeeper: gatekeeperKey,
            gatekeeperNetwork: gatekeeperNetworkKey,
            owner,
            state: State.ACTIVE,
            programId: new PublicKey(PROGRAM_ID.toBase58()), // Key has to be re-constructed here for deep.eq to work.
            publicKey: testPubKey,
            expiryTime: undefined,
          });
        });
      });
    });

    context("with showRevoked true", () => {
      context("with a revoked account", () => {
        it("should return an array with the revoked account marked as isValid false", async () => {
          const testPubKey = Keypair.generate().publicKey;
          getProgramAccountsStub.resolves([
            getAccountWithState(
              new GatewayTokenState({ revoked: new Revoked({}) }),
              testPubKey,
              owner,
              gatekeeperNetworkKey,
              gatekeeperKey
            ),
          ]);
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperNetworkKey,
            true
          );
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperNetwork: gatekeeperNetworkKey,
              owner,
              state: State.REVOKED,
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
              gatekeeperNetworkKey,
              gatekeeperKey
            ),
            getAccountWithState(
              new GatewayTokenState({ revoked: new Revoked({}) }),
              revokedPubKey,
              owner,
              gatekeeperNetworkKey,
              gatekeeperKey
            ),
          ]);
          const findGatewayTokensResponse = await findGatewayTokens(
            connection,
            owner,
            gatekeeperNetworkKey,
            true
          );
          expect(findGatewayTokensResponse.length).to.eq(2);
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperNetwork: gatekeeperNetworkKey,
              issuingGatekeeper: gatekeeperKey,
              owner,
              state: State.ACTIVE,
              publicKey: testPubKey,
              programId: PROGRAM_ID,
            },
            {
              gatekeeperNetwork: gatekeeperNetworkKey,
              issuingGatekeeper: gatekeeperKey,
              owner,
              state: State.REVOKED,
              publicKey: revokedPubKey,
              programId: PROGRAM_ID,
            },
          ]);
        });
      });
    });
  });

  context("when providing a gatekeeper network", () => {
    it("should filter on the owners public key and the gatekeeper network address", async () => {
      getProgramAccountsStub.resolves([]);
      await findGatewayTokens(connection, owner, gatekeeperNetworkKey);
      const { filters } = getProgramAccountsStub.getCalls()[0].args[1];
      const ownerFilter = filters[0].memcmp.bytes;
      const gknFilter = filters[1].memcmp.bytes;

      expect(filters.length).to.eq(2);
      expect(ownerFilter).to.eq(owner.toBase58());
      expect(gknFilter).to.eq(gatekeeperNetworkKey.toBase58());
    });
  });
});

describe("findAllGatewayTokens", () => {
  let connection: Connection;
  let owner: PublicKey;
  let getProgramAccountsStub: sinon.SinonStub;

  beforeEach(() => {
    connection = new Connection(VALIDATOR_URL);
    owner = Keypair.generate().publicKey;
    getProgramAccountsStub = sandbox
      .stub(connection, "getProgramAccounts")
      .withArgs(PROGRAM_ID);
  });
  afterEach(sandbox.restore);

  context("without providing a gatekeeper network", () => {
    it.only("should only filter on the owners public key", async () => {
      getProgramAccountsStub.resolves([]);
      await findAllGatewayTokens(connection, owner);
      const { filters } = getProgramAccountsStub.getCalls()[0].args[1];
      const result = filters[0].memcmp.bytes;

      expect(filters.length).to.eq(1);
      expect(result).to.eq(owner.toBase58());
    });
  });
});
