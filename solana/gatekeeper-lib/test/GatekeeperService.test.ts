import chai from "chai";
import chaiSubset from "chai-subset";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import sinon from "sinon";
import * as connectionUtils from "../src/util/connection";
import * as gatekeeperServiceModule from "../src/service/GatekeeperService";
import { PROGRAM_ID } from "../src/util/constants";
import { Active, GatewayToken, State } from "@identity.com/solana-gateway-ts";

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
  let gatewayTokenKey: PublicKey;
  let gatekeeperAccountKey: PublicKey;

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

    gatewayTokenKey = Keypair.generate().publicKey;
    gatekeeperAccountKey = Keypair.generate().publicKey;

    activeGatewayToken = new GatewayToken(
      Keypair.generate().publicKey, // Gatekeeper account
      gatekeeperNetwork.publicKey,
      tokenOwner.publicKey,
      State.ACTIVE,
      gatewayTokenKey,
      PROGRAM_ID
    );
    frozenGatewayToken = activeGatewayToken.update({ state: State.FROZEN });
    revokedGatewayToken = activeGatewayToken.update({ state: State.REVOKED });
  });
  context("issue", () => {
    beforeEach(() => {
      sandbox
        .stub(gatekeeperServiceModule, "getGatewayTokenKeyForOwner")
        .resolves(gatewayTokenKey);
      sandbox
        .stub(gatekeeperServiceModule, "getGatekeeperAccountKey")
        .resolves(gatekeeperAccountKey);
    });
    context("with send resolving success", () => {
      beforeEach(() => {
        sandbox.stub(connectionUtils, "send").resolves();
      });
      it("should return new gateway token", async () => {
        const issueResult = await gatekeeperService.issue(tokenOwner.publicKey);
        return expect(issueResult).to.containSubset({
          state: State.ACTIVE,
        });
      });
    });
    context("with send rejecting with an error", () => {
      beforeEach(() => {
        sandbox
          .stub(connectionUtils, "send")
          .rejects(new Error("Transaction simulation failed"));
      });
      context("with token not existing on-chain", () => {
        beforeEach(() => {
          sandbox
            .stub(gatekeeperServiceModule, "getGatewayToken")
            .resolves(null);
        });
        it("should throw an error", () => {
          return expect(
            gatekeeperService.issue(tokenOwner.publicKey)
          ).to.be.rejectedWith(/Transaction simulation failed/);
        });
      });
      context("with ACTIVE token existing on-chain", () => {
        beforeEach(() => {
          sandbox
            .stub(gatekeeperServiceModule, "getGatewayToken")
            .resolves(activeGatewayToken);
        });
        it("should return existing gateway token", async () => {
          const gatewayToken = await gatekeeperService.issue(
            tokenOwner.publicKey
          );
          return expect(gatewayToken).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
            owner: activeGatewayToken.owner,
          });
        });
      });
      context("with non-ACTIVE token existing on-chain", () => {
        beforeEach(() => {
          sandbox.stub(gatekeeperServiceModule, "getGatewayToken").resolves({
            ...activeGatewayToken,
            state: State.REVOKED,
          } as GatewayToken);
        });
        it("should throw an error", async () => {
          return expect(
            gatekeeperService.issue(tokenOwner.publicKey)
          ).to.be.rejectedWith(/Transaction simulation failed/);
        });
      });
    });
  });

  context("freeze", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox
          .stub(gatekeeperServiceModule, "getGatewayToken")
          .resolves(activeGatewayToken);
      });
      context("with the freeze blochchain call succeeding", () => {
        beforeEach(() => {
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with a FROZEN token", async () => {
          const result = await gatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          return expect(result).to.containSubset({
            state: State.FROZEN,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
      context("with the freeze blochchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
        });
        context("with the token already FROZEN on-chain", async () => {
          beforeEach(() => {
            sandbox
              .stub(gatekeeperServiceModule, "getGatewayToken")
              .resolves(frozenGatewayToken);
          });
          it("should resolve with the FROZEN token", async () => {
            const result = await gatekeeperService.freeze(
              activeGatewayToken.publicKey
            );
            return expect(result).to.containSubset({
              state: State.FROZEN,
              publicKey: activeGatewayToken.publicKey,
            });
          });
        });
        context("with the token still ACTIVE on-chain", async () => {
          beforeEach(() => {
            sandbox
              .stub(gatekeeperServiceModule, "getGatewayToken")
              .resolves(activeGatewayToken);
          });
          it("should throw an error", async () => {
            return expect(
              gatekeeperService.freeze(tokenOwner.publicKey)
            ).to.be.rejectedWith(/Transaction simulation failed/);
          });
        });
      });
    });
    context("with a REVOKED token on-chain (not ACTIVE or FROZEN)", () => {
      beforeEach(() => {
        sandbox
          .stub(gatekeeperServiceModule, "getGatewayToken")
          .resolves(revokedGatewayToken);
      });
      context("with the freeze blochchain call failing", () => {
        beforeEach(() => {
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
        });
        it("should throw an error", () => {
          return expect(
            gatekeeperService.freeze(tokenOwner.publicKey)
          ).to.be.rejectedWith(/Transaction simulation failed/);
        });
      });
    });
  });

  context("unfreeze", () => {
    context("with a previously Frozen token existing on-chain", () => {
      beforeEach(() => {
        sandbox
          .stub(gatekeeperServiceModule, "getGatewayToken")
          .resolves(frozenGatewayToken);
      });
      context("with the unfreeze blochchain call succeeding", () => {
        beforeEach(() => {
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with a ACTIVE token", async () => {
          const result = await gatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
      context("with the unfreeze blochchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
        });
        context("with the token already ACTIVE on-chain", async () => {
          beforeEach(() => {
            sandbox
              .stub(gatekeeperServiceModule, "getGatewayToken")
              .resolves(activeGatewayToken);
          });
          it("should resolve with the ACTIVE token", async () => {
            const result = await gatekeeperService.unfreeze(
              activeGatewayToken.publicKey
            );
            return expect(result).to.containSubset({
              state: State.ACTIVE,
              publicKey: activeGatewayToken.publicKey,
            });
          });
        });
        context("with the token still FROZEN on-chain", async () => {
          beforeEach(() => {
            sandbox
              .stub(gatekeeperServiceModule, "getGatewayToken")
              .resolves(frozenGatewayToken);
          });
          it("should throw an error", async () => {
            return expect(
              gatekeeperService.unfreeze(tokenOwner.publicKey)
            ).to.be.rejectedWith(/Transaction simulation failed/);
          });
        });
      });
    });
  });

  context("revoke", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox
          .stub(gatekeeperServiceModule, "getGatewayToken")
          .resolves(activeGatewayToken);
      });
      context("with the revoke blochchain call succeeding", () => {
        beforeEach(() => {
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with a REVOKED token", async () => {
          const result = await gatekeeperService.revoke(
            revokedGatewayToken.publicKey
          );
          return expect(result).to.containSubset({
            state: State.REVOKED,
            publicKey: revokedGatewayToken.publicKey,
          });
        });
      });
      context("with the revoke blochchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
        });
        context("with the token already REVOKED on-chain", async () => {
          beforeEach(() => {
            sandbox
              .stub(gatekeeperServiceModule, "getGatewayToken")
              .resolves(revokedGatewayToken);
          });
          it("should resolve with the REVOKED token", async () => {
            const result = await gatekeeperService.revoke(
              revokedGatewayToken.publicKey
            );
            return expect(result).to.containSubset({
              state: State.REVOKED,
              publicKey: revokedGatewayToken.publicKey,
            });
          });
        });
        context("with the token still ACTIVE on-chain", async () => {
          beforeEach(() => {
            sandbox
              .stub(gatekeeperServiceModule, "getGatewayToken")
              .resolves(activeGatewayToken);
          });
          it("should throw an error", async () => {
            return expect(
              gatekeeperService.revoke(tokenOwner.publicKey)
            ).to.be.rejectedWith(/Transaction simulation failed/);
          });
        });
      });
    });
  });

  context("updateExpiry", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox
          .stub(gatekeeperServiceModule, "getGatewayToken")
          .resolves(
            activeGatewayToken.update({ state: State.ACTIVE, expiryTime: 100 })
          ); // token starts with a low expiry time.
      });
      context("with the update blochchain call succeeding", () => {
        beforeEach(() => {
          sandbox.stub(connectionUtils, "send").resolves();
        });
        it("should resolve with the updated expiry token", async () => {
          const result = await gatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            123456
          );
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
            expiryTime: 123456,
          });
        });
      });
      context("with the update blochchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
        });
        context("with the expiry time already updated on-chain", async () => {
          beforeEach(() => {
            sandbox.stub(gatekeeperServiceModule, "getGatewayToken").resolves(
              activeGatewayToken.update({
                state: State.ACTIVE,
                expiryTime: 123456,
              })
            );
          });
          it("should resolve with the ACTIVE token with the updated expiry", async () => {
            const result = await gatekeeperService.updateExpiry(
              activeGatewayToken.publicKey,
              123456
            );
            return expect(result).to.containSubset({
              state: State.ACTIVE,
              publicKey: revokedGatewayToken.publicKey,
              expiryTime: 123456,
            });
          });
        });
        context("with the expiry time NOT updated on-chain", async () => {
          beforeEach(() => {
            sandbox.stub(gatekeeperServiceModule, "getGatewayToken").resolves(
              activeGatewayToken.update({
                state: State.ACTIVE,
                expiryTime: 100,
              })
            ); // expiryTime still at the low value, hasn't been updated correctly.
          });
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
