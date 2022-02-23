import chai from "chai";
import chaiSubset from "chai-subset";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";

import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import sinon from "sinon";
import { PROGRAM_ID } from "../src/util/constants";
import { GatewayToken, State } from "@identity.com/solana-gateway-ts";
import * as GatewayTs from "@identity.com/solana-gateway-ts";
import {
  GatekeeperService,
  SendableTransaction,
  SentTransaction,
} from "../src";
import { isContext } from "vm";

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

export const dummyBlockhash = "AvrGUhLXH2JTNA3AAsmhdXJTuHJYBUz5mgon26u8M85X";

describe("GatekeeperService", () => {
  let gatekeeperService: GatekeeperService;
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
      getRecentBlockhash: async () =>
        Promise.resolve({ blockhash: dummyBlockhash }),
      sendRawTransaction: async () => {
        Promise.resolve(
          "5cuE6h5EdvCHbhdgPYitnZLSrnWrH82nzisNG3AAAoa1T3A3GyYbWgoUShCgAD68Jd283jFLxR95FmrS7fXXvEHm"
        );
      },
      confirmTransaction: async () => {
        return { value: { err: null } };
      },
    } as unknown as Connection; // The connection won't be called as we're stubbing at a higher level.
    payer = Keypair.generate();
    tokenOwner = Keypair.generate();
    gatekeeperNetwork = Keypair.generate();
    gatekeeperAuthority = Keypair.generate();
    gatekeeperService = new GatekeeperService(
      connection,
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

  const stubSend = <T>(sendableTransaction: SendableTransaction, result: T) => {
    const sentTransaction = new SentTransaction(connection, "");
    const dataTransaction = sentTransaction.withData(result);
    sandbox.stub(sentTransaction, "withData").returns(dataTransaction);
    sandbox.stub(sentTransaction, "confirm").resolves();
    sandbox.stub(dataTransaction, "confirm").resolves(result);
    return sandbox.stub(sendableTransaction, "send").resolves(sentTransaction);
  };

  it("SendableTransaction serialization", async () => {
    const keypair1 = Keypair.generate();
    const keypair2 = Keypair.generate();
    const transfer = SystemProgram.transfer({
      fromPubkey: keypair1.publicKey,
      toPubkey: keypair2.publicKey,
      lamports: 10,
    });
    const transaction = new SendableTransaction(connection, new Transaction());
    transaction.transaction.add(transfer);
    transaction.transaction.feePayer = keypair2.publicKey;
    transaction.transaction.recentBlockhash = await connection
      .getRecentBlockhash("confirmed")
      .then((rbh) => rbh.blockhash);
    transaction.partialSign(keypair1);
    const serialized = transaction.transaction.serialize({
      requireAllSignatures: false,
    });

    const newTransaction = SendableTransaction.fromSerialized(
      connection,
      serialized
    );
    expect(newTransaction.transaction.verifySignatures()).to.be.false;
    newTransaction.partialSign(keypair2);
    expect(newTransaction.transaction.verifySignatures()).to.be.true;
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
      it("should return new gateway token", async () => {
        const issueResult = await gatekeeperService.issue(tokenOwner.publicKey);
        stubSend(issueResult.sendableTransaction, activeGatewayToken);
        const result = await issueResult.send().then((t) => t.confirm());
        return expect(result).to.equal(activeGatewayToken);
      });
    });
    context("with send rejecting with an error", () => {
      it("should throw an error", async () => {
        const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
        sandbox
          .stub(transaction, "send")
          .rejects(new Error("Transaction simulation failed"));
        return expect(transaction.send()).to.be.rejectedWith(
          /Transaction simulation failed/
        );
      });
    });
  });

  context("sendIssue", () => {
    beforeEach(() => {
      sandbox
        .stub(GatewayTs, "getGatewayTokenAddressForOwnerAndGatekeeperNetwork")
        .resolves(gatewayTokenAddress);
      sandbox
        .stub(GatewayTs, "getGatekeeperAccountAddress")
        .resolves(gatekeeperAccountAddress);
      sandbox.stub(GatewayTs, "getGatewayToken").resolves(activeGatewayToken);
    });
    context("with send resolving success", () => {
      it("should return new gateway token", async () => {
        const issueResult = await gatekeeperService.sendIssue(
          tokenOwner.publicKey
        );
        return expect(issueResult).to.equal(activeGatewayToken);
      });
    });
    context("with send rejecting with an error", () => {
      it("should throw an error", async () => {
        const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
        sandbox
          .stub(transaction, "send")
          .rejects(new Error("Transaction simulation failed"));
        return expect(transaction.send()).to.be.rejectedWith(
          /Transaction simulation failed/
        );
      });
    });
  });

  context("freeze", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(activeGatewayToken);
      });
      context("with the freeze blockchain call succeeding", () => {
        it("should resolve with a FROZEN token", async () => {
          const transaction = await gatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            state: State.FROZEN,
          });
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
            state: State.FROZEN,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("sendFreeze", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(activeGatewayToken);
      });
      context("with the freeze blockchain call succeeding", () => {
        it("should resolve with a FROZEN token", async () => {
          const transaction = await gatekeeperService.sendFreeze(
            activeGatewayToken.publicKey
          );
          return expect(transaction).to.equal(activeGatewayToken);
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
        it("should resolve with a ACTIVE token", async () => {
          const transaction = await gatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            state: State.ACTIVE,
          });
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("sendUnfreeze", () => {
    context("with a previously Frozen token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(frozenGatewayToken);
      });
      context("with the unfreeze blockchain call succeeding", () => {
        it("should resolve with a ACTIVE token", async () => {
          const transaction = await gatekeeperService.sendUnfreeze(
            activeGatewayToken.publicKey
          );
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
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
        it("should resolve with a REVOKED token", async () => {
          const transaction = await gatekeeperService.revoke(
            revokedGatewayToken.publicKey
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            state: State.REVOKED,
          });
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
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
        });
        it("should throw an error", async () => {
          const transaction = await gatekeeperService.revoke(
            tokenOwner.publicKey
          );
          sandbox
            .stub(transaction, "send")
            .rejects(new Error("Transaction simulation failed"));
          return expect(transaction.send()).to.be.rejectedWith(
            /Transaction simulation failed/
          );
        });
      });
    });
  });

  context("sendRevoke", () => {
    context("with a previously Active token existing on-chain", () => {
      beforeEach(() => {
        sandbox.stub(GatewayTs, "getGatewayToken").resolves(activeGatewayToken);
      });
      context("with the revoke blockchain call succeeding", () => {
        it("should resolve with a REVOKED token", async () => {
          const transaction = await gatekeeperService.sendRevoke(
            revokedGatewayToken.publicKey
          );
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
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
        });
        it("should throw an error", async () => {
          const transaction = await gatekeeperService.sendRevoke(
            tokenOwner.publicKey
          );
          sandbox
            .stub(transaction, "send")
            .rejects(new Error("Transaction simulation failed"));
          return expect(transaction.send()).to.be.rejectedWith(
            /Transaction simulation failed/
          );
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
        it("should resolve with the updated expiry token", async () => {
          const transaction = await gatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            newExpiry
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            expiryTime: newExpiry,
          });
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
            expiryTime: newExpiry,
          });
        });
      });
      context("with the update blockchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox.stub(GatewayTs, "getGatewayToken").resolves(
            activeGatewayToken.update({
              state: State.ACTIVE,
              expiryTime: 100,
            })
          );
        });

        it("should resolve with the ACTIVE token with the updated expiry", async () => {
          it("should throw an error", async () => {
            const transaction = await gatekeeperService.updateExpiry(
              tokenOwner.publicKey,
              123456
            );
            sandbox
              .stub(transaction, "send")
              .rejects(new Error("Transaction simulation failed"));
            return expect(transaction.send()).to.be.rejectedWith(
              /Transaction simulation failed/
            );
          });
        });
      });
    });
  });
  
  context("sendUpdateExpiry", () => {
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
        it("should resolve with the updated expiry token", async () => {
          const transaction = await gatekeeperService.sendUpdateExpiry(
            revokedGatewayToken.publicKey,
            newExpiry
          );
          const result = await transaction.send().then((t) => t.confirm());
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
            expiryTime: newExpiry,
          });
        });
      });
      context("with the update blockchain call failing", () => {
        beforeEach(() => {
          sandbox.restore();
          sandbox.stub(GatewayTs, "getGatewayToken").resolves(
            activeGatewayToken.update({
              state: State.ACTIVE,
              expiryTime: 100,
            })
          );
        });

        it("should resolve with the ACTIVE token with the updated expiry", async () => {
          it("should throw an error", async () => {
            const transaction = await gatekeeperService.sendUpdateExpiry(
              tokenOwner.publicKey,
              123456
            );
            sandbox
              .stub(transaction, "send")
              .rejects(new Error("Transaction simulation failed"));
            return expect(transaction.send()).to.be.rejectedWith(
              /Transaction simulation failed/
            );
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

    it("should return a valid transaction", async () => {
      const buildResponse = await gatekeeperService.issue(tokenOwner.publicKey);

      expectValidGatewayTransaction(buildResponse.transaction);
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

      it("should return a valid unserialized transaction", async () => {
        const buildResponse = await gatekeeperService.updateExpiry(
          tokenOwner.publicKey,
          newExpiry
        );
        expectValidGatewayTransaction(buildResponse.transaction);
      });
    });
  });

  context("updateTransactionBlockhash", () => {
    let recentBlockhash: string =
      "BvrGUhLXH2JTNA3AAsmhdXJTuHJYBUz5mgon26u8M85X";

    it("should error if not validly signed by gatekeeper", async () => {
      const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
      transaction.transaction.signatures = [];
      expect(() =>
        gatekeeperService.updateTransactionBlockhash(transaction, {
          blockhashOrNonce: { recentBlockhash },
        })
      ).to.throw;
    });

    it("should update blockhash and sign if validly signed", async () => {
      const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
      await gatekeeperService.updateTransactionBlockhash(transaction, {
        blockhashOrNonce: { recentBlockhash },
      });
      expect(transaction.transaction.recentBlockhash).to.equal(recentBlockhash);
      expect(transaction.transaction.verifySignatures()).to.be.true;
    });
  });
});
