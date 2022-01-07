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

import { addGatekeeper } from "@identity.com/solana-gateway-ts";

chai.use(chaiAsPromised);
const { expect } = chai;

const sandbox = sinon.createSandbox();

describe("Solana connection utils tests", () => {
  let connection;
  let transaction;
  const confirmResponseSuccess: RpcResponseAndContext<SignatureResult> = {
    context: { slot: 123 },
    value: { err: null },
  };
  afterEach(() => {
    sandbox.restore();
  });
  beforeEach(async () => {
    connection = {
      sendTransaction: sinon.stub().resolves("txId123"),
      confirmTransaction: sinon.stub().resolves(confirmResponseSuccess),
      getAccountInfo: sinon.stub().resolves({ status: 200, statusText: "ok" }),
      getProgramAccounts: sinon
        .stub()
        .resolves({ status: 200, statusText: "ok" }),
    } as unknown as Connection;

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
  describe("send call", () => {
    describe("with getAccountInfo timing out every time", () => {
      it("should call connection.sendTransaction", async () => {
        const results = await Promise.allSettled([
          connectionUtils.send(connection, transaction),
        ]);
        const calls = connection.sendTransaction.getCalls();
        return expect(calls.length).to.equal(1);
      });

      it("should call connection.confirmTransaction", async () => {
        const results = await Promise.allSettled([
          connectionUtils.send(connection, transaction),
        ]);
        const calls = connection.confirmTransaction.getCalls();
        return expect(calls.length).to.equal(1);
      });
    });
  });
});
