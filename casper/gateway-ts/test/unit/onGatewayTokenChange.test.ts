import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import {
  AccountChangeCallback,
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  GatewayToken,
  onGatewayTokenChange,
  removeAccountChangeListener,
  State,
} from "../../src";
import { PROGRAM_ID } from "../../src/lib/constants";
import {
  Active,
  GatewayTokenData,
  GatewayTokenState,
  Revoked,
} from "../../src/lib/GatewayTokenData";
import { AssignablePublicKey } from "../../src/lib/AssignablePublicKey";
import { VALIDATOR_URL } from "../constatnts";

chai.use(chaiSubset);
const { expect } = chai;
const sandbox = sinon.createSandbox();

function toAccountInfo(gatewayTokenData: GatewayTokenData) {
  return {
    data: gatewayTokenData.encode(),
    executable: false,
    lamports: 0,
    owner: PROGRAM_ID,
  };
}

describe("onGatewayTokenChange", () => {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let gatewayTokenKey: PublicKey;
  let gatekeeperNetworkKey: PublicKey;

  let gatewayTokenData: GatewayTokenData;

  beforeEach(() => {
    connection = new Connection(VALIDATOR_URL);
    owner = Keypair.generate().publicKey;
    gatekeeperKey = Keypair.generate().publicKey;
    gatewayTokenKey = Keypair.generate().publicKey;
    gatekeeperNetworkKey = Keypair.generate().publicKey;

    gatewayTokenData = new GatewayTokenData({
      owner: AssignablePublicKey.fromPublicKey(owner),
      issuingGatekeeper: AssignablePublicKey.fromPublicKey(gatekeeperKey),
      gatekeeperNetwork:
        AssignablePublicKey.fromPublicKey(gatekeeperNetworkKey),
      state: new GatewayTokenState({ active: new Active({}) }),
      features: [0],
    });
  });
  afterEach(sandbox.restore);

  context("when the gateway token state changes", () => {
    it("should call the callback with the new state", async () => {
      // we are going to store the results of the callback in here
      const gatewayTokenHistory: GatewayToken[] = [];
      const subscriptionId = 1234;

      // every time the callback is called, push the gateway token into the history array
      const callback = (gatewayToken: GatewayToken) => {
        gatewayTokenHistory.push(gatewayToken);
      };

      // get a handle on the account change callback (that takes an account info object)
      // so that it can be called to simulate an account changing.
      let accountChangeCallback: AccountChangeCallback = () => {};
      sandbox
        .stub(connection, "onAccountChange")
        .callsFake((publicKey: PublicKey, callback: AccountChangeCallback) => {
          accountChangeCallback = callback;
          return subscriptionId;
        });

      // register the gateway token change event listener
      const onGatewayTokenChangeId = onGatewayTokenChange(
        connection,
        gatewayTokenKey,
        callback
      );

      // trigger a gateway token change event
      accountChangeCallback(toAccountInfo(gatewayTokenData), { slot: 0 });

      // change the gateway token state and trigger the change event again
      gatewayTokenData.state = new GatewayTokenState({
        revoked: new Revoked({}),
      });
      accountChangeCallback(toAccountInfo(gatewayTokenData), { slot: 0 });

      // if the registered callback was called both times, then the history should have two entries
      expect(gatewayTokenHistory.length).to.equal(2);
      expect(gatewayTokenHistory[0].state).to.equal(State.ACTIVE);
      expect(gatewayTokenHistory[1].state).to.equal(State.REVOKED);
      expect(onGatewayTokenChangeId).to.equal(subscriptionId);
    });
  });

  context("when subscribing to gateway token state changes", () => {
    it("should stop listening to gateway state changes", async () => {
      const gatewayTokenHistory: GatewayToken[] = [];
      const subscriptionId = 1234;

      // Add subscription and return subscription id
      // Stop listening to the subscription by providing the subscription id
      sandbox.stub(connection, "onAccountChange").returns(subscriptionId);

      const removeAccountChangeStub = sandbox
        .stub(connection, "removeAccountChangeListener")
        .resolves();

      // register the gateway token change event listener
      const onGatewayTokenChangeId = onGatewayTokenChange(
        connection,
        gatewayTokenKey,
        () => {}
      );

      // remove the token event listener
      removeAccountChangeListener(connection, onGatewayTokenChangeId);

      // expect removeAccountChangeListener to have been called
      expect(removeAccountChangeStub.called).to.be.true;
    });
  });
});
