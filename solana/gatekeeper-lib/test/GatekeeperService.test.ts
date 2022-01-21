import chai from "chai";
import chaiSubset from "chai-subset";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import sinon from "sinon";
import * as connectionUtils from "../src/util/connection";
import * as gatekeeperServiceModule from "../src/service/GatekeeperService";
import { PROGRAM_ID } from "../src/util/constants";
import { GatewayToken, State } from "@identity.com/solana-gateway-ts";
import * as GatewayTs from "@identity.com/solana-gateway-ts";
import { DataTransaction, SentTransaction } from "../src/util/connection";
import * as transactionUtils from "../src/util/transaction";

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

export const dummyBlockhash = "AvrGUhLXH2JTNA3AAsmhdXJTuHJYBUz5mgon26u8M85X";

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
    connection = {
      getRecentBlockhash: () => ({ blockhash: dummyBlockhash }),
    } as unknown as Connection; // The connection won't be called as we're stubbing at a higher level.
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
    return sandbox.stub(connectionUtils, "send").resolves(sentTransaction);
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
  const expectValidGatewayTransaction = (transaction: Transaction) => {
    expect(transaction).to.be.an.instanceOf(Transaction);
    expect(transaction.instructions[0].programId.toBase58()).to.eq(
      PROGRAM_ID.toBase58()
    );
    expect(transaction.recentBlockhash).to.be.a("string");
  };

  context("buildIssueTransaction", () => {
    beforeEach(() => {
      sandbox
        .stub(GatewayTs, "getGatewayTokenAddressForOwnerAndGatekeeperNetwork")
        .resolves(gatewayTokenAddress);
      sandbox
        .stub(GatewayTs, "getGatekeeperAccountAddress")
        .resolves(gatekeeperAccountAddress);
    });
    beforeEach(() => {
      stubSend(activeGatewayToken);
    });

    it("should return a valid unserialized transaction", async () => {
      const buildResponse = await gatekeeperService.buildIssueTransaction(
        tokenOwner.publicKey
      );
      expect(buildResponse.serializedTx).to.be.a("string");
      const rehydratedTransaction = Transaction.from(
        Buffer.from(buildResponse.serializedTx, "base64")
      );
      expectValidGatewayTransaction(rehydratedTransaction);
    });

    it("should return a valid transaction", async () => {
      const buildResponse = await gatekeeperService.buildIssueTransaction(
        tokenOwner.publicKey
      );
      expectValidGatewayTransaction(buildResponse.transaction);
    });

    it("should return a valid gatewayTokenAddress", async () => {
      const buildResponse = await gatekeeperService.buildIssueTransaction(
        tokenOwner.publicKey
      );
      expect(buildResponse.gatewayTokenAddress.toBase58()).to.a("string");
    });
  });

  context("buildUpdateExpiryTransaction", () => {
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
      it("should return a valid unserialized transaction", async () => {
        const buildResponse =
          await gatekeeperService.buildUpdateExpiryTransaction(
            tokenOwner.publicKey,
            newExpiry
          );
        expect(buildResponse.serializedTx).to.be.a("string");
        const rehydratedTransaction = Transaction.from(
          Buffer.from(buildResponse.serializedTx, "base64")
        );
        expectValidGatewayTransaction(rehydratedTransaction);
      });

      it("should return a valid transaction", async () => {
        const buildResponse =
          await gatekeeperService.buildUpdateExpiryTransaction(
            tokenOwner.publicKey,
            newExpiry
          );
        expectValidGatewayTransaction(buildResponse.transaction);
      });

      it("should return a valid gatewayTokenAddress", async () => {
        const buildResponse =
          await gatekeeperService.buildUpdateExpiryTransaction(
            tokenOwner.publicKey,
            newExpiry
          );
        expect(buildResponse.gatewayTokenAddress.toBase58()).to.a("string");
      });
    });
  });

  context("sendSerializedTransaction", () => {
    let transaction;
    let serializedTx;
    let recentBlockhash;
    let sendStub;
    beforeEach(async () => {
      recentBlockhash = Keypair.generate().publicKey.toBase58();
      ({ transaction, serializedTx } =
        await gatekeeperService.buildIssueTransaction(tokenOwner.publicKey));
      sandbox.stub(Transaction, "from").returns(transaction);
      sendStub = stubSend(activeGatewayToken);
      connection.getRecentBlockhash = sandbox.stub().resolves(recentBlockhash);
    });

    context("with an invalid program id on the transaction", () => {
      beforeEach(() => {
        sandbox.stub(transactionUtils, "isGatewayTransaction").returns(false);
      });
      it("should throw an error", async () => {
        return expect(
          gatekeeperService.sendSerializedTransaction(
            serializedTx,
            gatewayTokenAddress
          )
        ).to.be.rejectedWith(/transaction must be for the gateway program/);
      });
    });

    context("with a valid program id on the transaction", () => {
      beforeEach(() => {
        sandbox.stub(transactionUtils, "isGatewayTransaction").returns(true);
      });

      it("should call send", async () => {
        await gatekeeperService.sendSerializedTransaction(
          serializedTx,
          gatewayTokenAddress
        );
        expect(sendStub).calledOnce;
      });
    });
  });
});
