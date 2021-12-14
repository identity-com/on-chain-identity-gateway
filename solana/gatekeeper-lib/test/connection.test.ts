import chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import * as connectionUtils from "../src/util/connection";
import {
  Transaction,
  Keypair,
  RpcResponseAndContext,
  SignatureResult,
  Connection,
} from "@solana/web3.js";
import { proxyConnectionWithRetry } from "../../gateway-ts/src/lib/util";

import { addGatekeeper } from "@identity.com/solana-gateway-ts";

chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

describe("Solana connection utils tests", () => {
  let underlyingConnection;
  let proxiedConnection;
  let transaction;
  const confirmResponseSuccess: RpcResponseAndContext<SignatureResult> = {
    context: { slot: 123 },
    value: { err: null },
  };
  afterEach(() => {
    sandbox.restore();
  });
  beforeEach(async () => {
    // Proxy the connection with a default timeout of 200ms to save time.
    underlyingConnection = {
      sendTransaction: sinon.stub().resolves("txId123"),
      confirmTransaction: sinon.stub().resolves(confirmResponseSuccess),
      getAccountInfo: sinon.stub().resolves({ status: 200, statusText: "ok" }),
      getProgramAccounts: sinon
        .stub()
        .resolves({ status: 200, statusText: "ok" }),
    } as unknown as Connection;

    // For tests we disable exponential backoff to save time (factor = 1), and the initial timeout is 200ms.
    proxiedConnection = proxyConnectionWithRetry(underlyingConnection, {
      exponentialFactor: 1,
      timeouts: { confirmed: 200 },
    });

    // Some dummy data for a transaction.
    // It won't really be sent so doesn't matter what it is.
    transaction = new Transaction().add(
      addGatekeeper(
        Keypair.generate().publicKey,
        Keypair.generate().publicKey,
        Keypair.generate().publicKey,
        Keypair.generate().publicKey
      )
    );
  });
  describe("send", () => {
    describe("with blockchain timing out every time", () => {
      beforeEach(() => {
        // Make the blockchain call take longer than 200ms:
        underlyingConnection.sendTransaction.callsFake(async () => {
          return new Promise((resolve) =>
            setTimeout(() => resolve("txId123"), 500)
          );
        });
      });
      it("should retry 3 times and then fail", async () => {
        const results = await Promise.allSettled([
          connectionUtils.send(proxiedConnection, transaction),
        ]);
        expect(results[0].status).to.equal("rejected");
        const calls = underlyingConnection.sendTransaction.getCalls();
        expect(calls.length).to.equal(4); // Initial call and 3 retries
      });
    });

    describe("with first call timing out and second call succeeding", () => {
      beforeEach(() => {
        // First call times out:
        underlyingConnection.sendTransaction
          .onFirstCall()
          .callsFake(async () => {
            return new Promise(
              (resolve) => setTimeout(() => resolve("txId123"), 500) // late, after timeout
            );
          });

        // Second call succeeds:
        underlyingConnection.sendTransaction.onSecondCall().resolves("txId123");
      });
      it("should retry once and then succeed", async () => {
        const result = await connectionUtils.send(
          proxiedConnection,
          transaction
        );
        expect(result).to.equal("txId123");

        const calls = underlyingConnection.sendTransaction.getCalls();
        expect(calls.length).to.equal(2); // Initial call and 3 retries
      });
    });

    describe("with first call timing out and second call failing", () => {
      beforeEach(() => {
        // First call times out:
        underlyingConnection.sendTransaction
          .onFirstCall()
          .callsFake(async () => {
            return new Promise(
              (resolve) =>
                setTimeout(() => resolve(confirmResponseSuccess), 500) // late, after timeout
            );
          });

        // Second call throws:
        underlyingConnection.sendTransaction
          .onSecondCall()
          .throws(new Error("Transaction simulation error"));

        // third call will succeed because that's the default at the top of this file.
      });
      it("should retry 3 times", async () => {
        try {
          await connectionUtils.send(proxiedConnection, transaction);
        } catch {
          // expect the promise to reject.
        }
        const calls = underlyingConnection.sendTransaction.getCalls();
        return expect(calls.length).to.equal(3); // Initial call and 3 retries
      });
    });
  });
});
