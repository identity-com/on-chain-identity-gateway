import chai from "chai";
import chaiSubset from "chai-subset";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import sinon from "sinon";
import * as connectionUtils from "../src/util/connection";
import * as gatekeeperServiceModule from "../src/service/GatekeeperService";
import { PROGRAM_ID } from "../src/util/constants";
import { GatewayToken, State } from "@identity.com/solana-gateway-ts";
import * as GatewayTs from "@identity.com/solana-gateway-ts";

chai.use(chaiSubset);
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
        sandbox.stub(connectionUtils, "send").resolves();
      });
      it("should return new gateway token", async () => {
        const issueResult = await gatekeeperService.issue(tokenOwner.publicKey);
        return expect(issueResult).to.containSubset({
          gatewayToken: { state: State.ACTIVE },
        });
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
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with a FROZEN token", async () => {
          const result = await gatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          return expect(result).to.containSubset({
            gatewayToken: {
              state: State.FROZEN,
              publicKey: activeGatewayToken.publicKey,
            },
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
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with a ACTIVE token", async () => {
          const result = await gatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          return expect(result).to.containSubset({
            gatewayToken: {
              state: State.ACTIVE,
              publicKey: activeGatewayToken.publicKey,
            },
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
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with a REVOKED token", async () => {
          const result = await gatekeeperService.revoke(
            revokedGatewayToken.publicKey
          );
          return expect(result).to.containSubset({
            gatewayToken: {
              state: State.REVOKED,
              publicKey: revokedGatewayToken.publicKey,
            },
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
        beforeEach(() => {
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with the updated expiry token", async () => {
          const result = await gatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            123456
          );
          return expect(result).to.containSubset({
            gatewayToken: {
              state: State.ACTIVE,
              publicKey: activeGatewayToken.publicKey,
              expiryTime: 123456,
            },
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
