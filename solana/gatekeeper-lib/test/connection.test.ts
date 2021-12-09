import chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import * as web3 from "@solana/web3.js";
import * as connectionUtils from "../src/util/connection";
import * as constants from "../src/util/constants";
import { Transaction, Keypair } from "@solana/web3.js";

import { addGatekeeper } from "@identity.com/solana-gateway-ts";

chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

describe("Solana connection utils tests", () => {
  let blockchainStub;
  let timeoutConstantStub;
  let connection;
  let transaction;
  afterEach(sandbox.restore);
  beforeEach(() => {
    blockchainStub = sandbox.stub(web3, "sendAndConfirmTransaction");
    // Our default commitment is CONFIRMED so use the timeout for that.
    timeoutConstantStub = sandbox.stub(constants, "SOLANA_TIMEOUT_CONFIRMED");

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
    connection = connectionUtils.getConnection();

    // stub the timeout to 200ms to save time:
    timeoutConstantStub.value(200);
  });
  describe("send", () => {
    describe("with blockchain timing out every time", () => {
      beforeEach(() => {
        // Make the blockchain call take longer than 200ms:
        blockchainStub.callsFake(async () => {
          return new Promise(
            (resolve) => setTimeout(() => resolve("txId123"), 500) // late, after timeout
          );
        });
      });
      it("should retry 3 times and then fail", async () => {
        const results = await Promise.allSettled([
          connectionUtils.send(connection, transaction, 3),
        ]);
        expect(results[0].status).to.equal("rejected");
        const calls = blockchainStub.getCalls();
        expect(calls.length).to.equal(4); // Initial call and 3 retries
      });
    });

    describe("with first call timing out and second call succeeding", () => {
      beforeEach(() => {
        // First call times out:
        blockchainStub.onFirstCall().callsFake(async () => {
          return new Promise(
            (resolve) => setTimeout(() => resolve("txId123"), 500) // late, after timeout
          );
        });

        // Second call succeeds:
        blockchainStub.onSecondCall().resolves("txId123");
      });
      it("should retry once and then succeed", async () => {
        const result = await connectionUtils.send(connection, transaction, 3);
        expect(result).to.equal("txId123");

        const calls = blockchainStub.getCalls();
        expect(calls.length).to.equal(2); // Initial call and 3 retries
      });
    });

    describe("with first call timing out and second call failing", () => {
      beforeEach(() => {
        // First call times out:
        blockchainStub.onFirstCall().callsFake(async () => {
          return new Promise(
            (resolve) => setTimeout(() => resolve("txId123"), 500) // late, after timeout
          );
        });

        // Second call throws:
        blockchainStub
          .onSecondCall()
          .throws(new Error("Transaction simulation error"));
      });
      it("should retry once and then fail", async () => {
        try {
          await connectionUtils.send(connection, transaction, 3);
        } catch {
          // expect the promise to reject.
        }
        const calls = blockchainStub.getCalls();
        return expect(calls.length).to.equal(2); // Initial call and 3 retries
      });
    });
  });
});
