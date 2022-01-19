import chai from "chai";
import chaiSubset from "chai-subset";
import {
  Keypair,
  Connection,
  PublicKey,
  SendTransactionError,
} from "@solana/web3.js";
import sinon from "sinon";
import * as connectionUtils from "../src/util/connection";
import * as gatekeeperServiceModule from "../src/service/GatekeeperService";
import { PROGRAM_ID } from "../src/util/constants";
import { GatewayToken, State } from "@identity.com/solana-gateway-ts";
import { SentTransaction } from "../src/util/connection";

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
  let getGatewayTokenStub;

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

    getGatewayTokenStub = sandbox.stub(
      gatekeeperServiceModule,
      "getGatewayToken"
    );
  });
  context("issue", () => {
    beforeEach(() => {
      getGatewayTokenStub.resolves(gatewayTokenKey);
      getGatewayTokenStub.resolves(gatekeeperAccountKey);
    });
    context("with send resolving success", () => {
      beforeEach(() => {
        const connection = {} as unknown as Connection;
        sandbox
          .stub(connectionUtils, "send")
          .resolves(
            new connectionUtils.SentTransaction(connection, "txSig123")
          );
      });
      it("should return sent tx details", async () => {
        const issueResult = await gatekeeperService.issue(tokenOwner.publicKey);
        return expect(issueResult).to.containSubset({
          sentTransaction: {
            _signature: "txSig123",
          },
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
      let confirmStub;
      beforeEach(() => {
        getGatewayTokenStub.resolves(activeGatewayToken);
      });
      context("with the send call succeeding", () => {
        beforeEach(() => {
          confirmStub = sinon.stub();
          const connection = {
            confirmTransaction: confirmStub,
          } as unknown as Connection;
          const sendResult = new SentTransaction(connection, "txSig123");
          sandbox.stub(connectionUtils, "send").resolves(sendResult);
        });

        it("should return a DataTransaction", async () => {
          const result = await gatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          expect(result.data).to.be.instanceOf(Function);
          expect(result.sentTransaction).to.containSubset({
            _signature: "txSig123",
          });
        });

        context("with the confirm call succeeding", () => {
          beforeEach(() => {
            confirmStub.resolves({ value: {} }); // no Error
          });
          context("with getGatewayToken returning a frozen token", () => {
            beforeEach(() => {
              getGatewayTokenStub.resolves(frozenGatewayToken);
            });
            it("should return Frozen token on confirm", async () => {
              const sendResult = await gatekeeperService.freeze(
                activeGatewayToken.publicKey
              );
              const confirmResult = await sendResult.confirm();
              expect(confirmResult).to.containSubset({ state: State.FROZEN });
            });
          });
        });
      });
    });
  });

  context("unfreeze", () => {
    context("with a previously Frozen token existing on-chain", () => {
      let confirmStub;
      beforeEach(() => {
        getGatewayTokenStub.resolves(frozenGatewayToken);
      });
      context("with the send call succeeding", () => {
        beforeEach(() => {
          confirmStub = sinon.stub();
          const connection = {
            confirmTransaction: confirmStub,
          } as unknown as Connection;
          const sendResult = new SentTransaction(connection, "txSig123");
          sandbox.stub(connectionUtils, "send").resolves(sendResult);
        });

        it("should return a DataTransaction", async () => {
          const result = await gatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          expect(result.data).to.be.instanceOf(Function);
          expect(result.sentTransaction).to.containSubset({
            _signature: "txSig123",
          });
        });

        context("with the confirm call succeeding", () => {
          beforeEach(() => {
            confirmStub.resolves({ value: {} }); // no Error
          });
          context("with getGatewayToken returning a Active token", () => {
            beforeEach(() => {
              getGatewayTokenStub.resolves(activeGatewayToken);
            });
            it("should return Active token on confirm", async () => {
              const sendResult = await gatekeeperService.freeze(
                activeGatewayToken.publicKey
              );
              const confirmResult = await sendResult.confirm();
              expect(confirmResult).to.containSubset({ state: State.ACTIVE });
            });
          });
        });
      });
    });
  });

  context("revoke", () => {
    context("with a previously Active token existing on-chain", () => {
      let confirmStub;
      beforeEach(() => {
        getGatewayTokenStub.resolves(activeGatewayToken);
      });
      context("with the send call succeeding", () => {
        beforeEach(() => {
          confirmStub = sinon.stub();
          const connection = {
            confirmTransaction: confirmStub,
          } as unknown as Connection;
          const sendResult = new SentTransaction(connection, "txSig123");
          sandbox.stub(connectionUtils, "send").resolves(sendResult);
        });

        it("should return a DataTransaction", async () => {
          const result = await gatekeeperService.revoke(
            activeGatewayToken.publicKey
          );
          expect(result.data).to.be.instanceOf(Function);
          expect(result.sentTransaction).to.containSubset({
            _signature: "txSig123",
          });
        });

        context("with the confirm call succeeding", () => {
          beforeEach(() => {
            confirmStub.resolves({ value: {} }); // no Error
          });
          context("with getGatewayToken returning a Revoked token", () => {
            beforeEach(() => {
              getGatewayTokenStub.resolves(revokedGatewayToken);
            });
            it("should return Active token on confirm", async () => {
              const sendResult = await gatekeeperService.revoke(
                activeGatewayToken.publicKey
              );
              const confirmResult = await sendResult.confirm();
              expect(confirmResult).to.containSubset({ state: State.REVOKED });
            });
          });
        });
      });
    });
  });

  context("updateExpiry", () => {
    context("with a previously Active token existing on-chain", () => {
      let confirmStub;
      beforeEach(() => {
        getGatewayTokenStub.resolves(
          activeGatewayToken.update({ state: State.ACTIVE, expiryTime: 100 })
        ); // token starts with a low expiry time.
      });
      context("with the send call succeeding", () => {
        beforeEach(() => {
          confirmStub = sinon.stub();
          const connection = {
            confirmTransaction: confirmStub,
          } as unknown as Connection;
          const sendResult = new SentTransaction(connection, "txSig123");
          sandbox.stub(connectionUtils, "send").resolves(sendResult);
        });

        it("should return a DataTransaction", async () => {
          const result = await gatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            123456
          );
          expect(result.data).to.be.instanceOf(Function);
          expect(result.sentTransaction).to.containSubset({
            _signature: "txSig123",
          });
        });

        context("with the confirm call succeeding", () => {
          beforeEach(() => {
            confirmStub.resolves({ value: {} }); // no Error
          });
          context("with getGatewayToken returning a Revoked token", () => {
            beforeEach(() => {
              getGatewayTokenStub.resolves({
                ...activeGatewayToken,
                expiryTime: 123456,
              });
            });
            it("should return Active token on confirm", async () => {
              const sendResult = await gatekeeperService.updateExpiry(
                revokedGatewayToken.publicKey,
                123456
              );
              const confirmResult = await sendResult.confirm();
              expect(confirmResult).to.containSubset({
                state: State.ACTIVE,
                publicKey: activeGatewayToken.publicKey,
                expiryTime: 123456,
              });
            });
          });
        });
      });
      context("with the send blochchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox
            .stub(connectionUtils, "send")
            .rejects(new Error("Transaction simulation failed"));
          getGatewayTokenStub.resolves(
            activeGatewayToken.update({
              state: State.ACTIVE,
              expiryTime: 100,
            })
          );
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
