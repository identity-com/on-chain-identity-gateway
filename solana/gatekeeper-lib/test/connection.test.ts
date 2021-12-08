import chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import * as web3 from "@solana/web3.js";
import * as connectionUtils from "../src/util/connection";
import * as constants from "../src/util/constants";
import { Transaction, Keypair, Connection } from "@solana/web3.js";

import { addGatekeeper } from "@identity.com/solana-gateway-ts";

chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

describe("Solana connection utils tests", () => {
  let blockchainStub: sinon.SinonStub;
  let timeoutConstantStub: sinon.SinonStub;
  let connection: Connection;
  let transaction: Transaction;
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
    describe("with blockchain timing out", () => {
      beforeEach(() => {
        // Make the blockchain call take longer than 200ms:
        blockchainStub.callsFake(async () => {
          return new Promise(
            (resolve) => setTimeout(() => resolve("txId123"), 500) // late, after timeout
          );
        });
      });
      it("should fail with timeout error", async () => {
        return expect(
          connectionUtils.send(connection, transaction)
        ).to.eventually.rejectedWith(/Solana call timed out/);
      });
    });
    describe("with blockchain throwing an error", () => {
      beforeEach(() => {
        // Make the blockchain call take longer than 200ms:
        blockchainStub.rejects(new Error("Transaction simulation failed"));
      });
      it("should fail with blockchain error", async () => {
        return expect(
          connectionUtils.send(connection, transaction)
        ).to.eventually.rejectedWith(/Transaction simulation failed/);
      });
    });
    describe("with blockchain returning success", () => {
      beforeEach(() => {
        // Make the blockchain call take longer than 200ms:
        blockchainStub.resolves("txId456");
      });
      it("should resolve the promise", async () => {
        return expect(
          connectionUtils.send(connection, transaction)
        ).to.eventually.equal("txId456");
      });
    });
  });
});
