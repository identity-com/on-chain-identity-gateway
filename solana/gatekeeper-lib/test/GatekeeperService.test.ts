import chai from "chai";
import chaiSubset from "chai-subset";
import chaiAsPromised from "chai-as-promised";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import sinon from "sinon";
import * as connectionUtils from "../src/util/connection";
import * as gatekeeperServiceModule from "../src/service/GatekeeperService";
import { PROGRAM_ID } from "../src/util/constants";
import { GatewayToken, State } from "@identity.com/solana-gateway-ts";
import * as GatewayTs from "@identity.com/solana-gateway-ts";
import { DataTransaction, SentTransaction } from "../src/util/connection";

chai.use(chaiSubset);
chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

describe("GatekeeperService", () => {
  let gatekeeperService: gatekeeperServiceModule.GatekeeperService;
  let connection: Connection;
  let payer: Keypair;
  let tokenOwner: Keypair;
  let gatekeeperNetwork: Keypair;
  let gatekeeperAuthority: Keypair;
  let activeGatewayToken: GatewayToken;
  let frozenGatewayToken: GatewayToken;
  let revokedGatewayToken: GatewayToken;
  let gatewayTokenAddress: PublicKey;
  let gatekeeperAccountAddress: PublicKey;

  afterEach(sandbox.restore);

  beforeEach(() => {
    connection = {} as unknown as Connection; // The connection won't be called as we're stubbing at a higher level.
    payer = Keypair.generate();
    tokenOwner = Keypair.generate();
    gatekeeperNetwork = Keypair.generate();
    gatekeeperAuthority = Keypair.generate();
    gatekeeperService = new gatekeeperServiceModule.GatekeeperService(
      connection,
      payer,
      gatekeeperNetwork.publicKey,
      gatekeeperAuthority
    );

    gatewayTokenAddress = Keypair.generate().publicKey;
    gatekeeperAccountAddress = Keypair.generate().publicKey;

    activeGatewayToken = new GatewayToken(
      Keypair.generate().publicKey, // Gatekeeper account
      gatekeeperNetwork.publicKey,
      tokenOwner.publicKey,
      State.ACTIVE,
      gatewayTokenAddress,
      PROGRAM_ID
    );
    frozenGatewayToken = activeGatewayToken.update({ state: State.FROZEN });
    revokedGatewayToken = activeGatewayToken.update({ state: State.REVOKED });
  });

  const stubSend = <T>(result: T) => {
    const sentTransaction = new SentTransaction(connection, "");
    sandbox
      .stub(sentTransaction, "withData")
      .returns(new DataTransaction<T>(sentTransaction, result));
    sandbox.stub(connectionUtils, "send").resolves(sentTransaction);
  };

  context("issue", () => {
    beforeEach(() => {
      sandbox
        .stub(GatewayTs, "getGatewayTokenAddressForOwnerAndGatekeeperNetwork")
        .resolves(gatewayTokenAddress);
      sandbox
        .stub(GatewayTs, "getGatekeeperAccountAddress")
        .resolves(gatekeeperAccountAddress);
    });
    context("with send resolving success", () => {
      beforeEach(() => {
        stubSend(activeGatewayToken);
      });
      it("should return new gateway token", async () => {
        const issueResult = await gatekeeperService.issue(tokenOwner.publicKey);
        return expect(issueResult.data).to.equal(activeGatewayToken);
      });
    });
    context("with send rejecting with an error", () => {
      beforeEach(() => {
        sandbox
          .stub(connectionUtils, "send")
          .rejects(new Error("Transaction simulation failed"));
      });
      it("should throw an error", () => {
        return expect(
          gatekeeperService.issue(tokenOwner.publicKey)
        ).to.be.rejectedWith(/Transaction simulation failed/);
      });
    });
  });

  context("freeze", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(activeGatewayToken);
      });
      context("with the freeze blockchain call succeeding", () => {
        beforeEach(() => {
          stubSend({
            ...activeGatewayToken,
            state: State.FROZEN,
          });
        });
        it("should resolve with a FROZEN token", async () => {
          const result = await gatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          return expect(result.data).to.containSubset({
            state: State.FROZEN,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("unfreeze", () => {
    context("with a previously Frozen token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(frozenGatewayToken);
      });
      context("with the unfreeze blockchain call succeeding", () => {
        beforeEach(() => {
          stubSend({
            ...activeGatewayToken,
            state: State.ACTIVE,
          });
        });
        it("should resolve with a ACTIVE token", async () => {
          const result = await gatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          return expect(result.data).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("revoke", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(activeGatewayToken);
      });
      context("with the revoke blockchain call succeeding", () => {
        beforeEach(() => {
          stubSend({
            ...activeGatewayToken,
            state: State.REVOKED,
          });
        });
        it("should resolve with a REVOKED token", async () => {
          const result = await gatekeeperService.revoke(
            revokedGatewayToken.publicKey
          );
          return expect(result.data).to.containSubset({
            state: State.REVOKED,
            publicKey: revokedGatewayToken.publicKey,
          });
        });
      });
      context("with the revoke blockchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(GatewayTs, "getGatewayToken")
            .resolves(activeGatewayToken);
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
        });
        it("should throw an error", async () => {
          return expect(
            gatekeeperService.revoke(tokenOwner.publicKey)
          ).to.be.rejectedWith(/Transaction simulation failed/);
        });
      });
    });
  });

  context("updateExpiry", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox
          .stub(GatewayTs, "getGatewayToken")
          .resolves(
            activeGatewayToken.update({ state: State.ACTIVE, expiryTime: 100 })
          ); // token starts with a low expiry time.
      });
      context("with the update blockchain call succeeding", () => {
        const newExpiry = 123456;
        beforeEach(() => {
          stubSend({
            ...activeGatewayToken,
            expiryTime: newExpiry,
          });
        });
        it("should resolve with the updated expiry token", async () => {
          const result = await gatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            newExpiry
          );
          return expect(result.data).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
            expiryTime: newExpiry,
          });
        });
      });
      context("with the update blockchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
          sandbox.stub(GatewayTs, "getGatewayToken").resolves(
            activeGatewayToken.update({
              state: State.ACTIVE,
              expiryTime: 100,
            })
          );
        });

        it("should resolve with the ACTIVE token with the updated expiry", async () => {
          it("should throw an error", async () => {
            return expect(
              gatekeeperService.updateExpiry(tokenOwner.publicKey, 123456)
            ).to.be.rejectedWith(/Transaction simulation failed/);
          });
        });
      });
    });
  });
});
