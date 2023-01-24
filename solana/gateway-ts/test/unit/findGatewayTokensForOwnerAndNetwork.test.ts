import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as R from "ramda";
import {
  State,
  Active,
  Revoked,
  GatewayTokenState,
  PROGRAM_ID,
  findGatewayTokensForOwnerAndNetwork,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
  SOLANA_COMMITMENT,
} from "../../src";
import { VALIDATOR_URL } from "../constants";
import { describe } from "mocha";
import { getAccountWithState, matchesPubkeyArray } from "./utils";
import { Assignable } from "../../src/lib/solanaBorsh";

chai.use(chaiSubset);
const { expect } = chai;
const sandbox = sinon.createSandbox();

describe("findGatewayTokensForOwnerAndNetwork", () => {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let gatekeeperNetworkKey: PublicKey;
  let gatewayTokenAddresses: PublicKey[];

  beforeEach(() => {
    connection = new Connection(VALIDATOR_URL);
    owner = Keypair.generate().publicKey;
    gatekeeperKey = Keypair.generate().publicKey;
    gatekeeperNetworkKey = Keypair.generate().publicKey;

    // generate the first 100 possible gateway token addresses
    // for use in tests.
    gatewayTokenAddresses = R.range(0, 100).map((i) =>
      getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        owner,
        gatekeeperNetworkKey,
        i
      )
    );
  });
  afterEach(sandbox.restore);

  const makeGTAccount = (
    address = gatewayTokenAddresses[0],
    statusProp: Record<string, Assignable> = { active: new Active({}) },
    expiry?: number
  ) =>
    getAccountWithState(
      new GatewayTokenState(statusProp),
      address,
      owner,
      gatekeeperNetworkKey,
      gatekeeperKey,
      expiry
    ).account;

  context("with no token accounts found", () => {
    it("should return an empty array", async () => {
      sandbox.stub(connection, "getMultipleAccountsInfo").resolves([]);
      const findGatewayTokensResponse =
        await findGatewayTokensForOwnerAndNetwork(
          connection,
          owner,
          gatekeeperNetworkKey
        );
      expect(findGatewayTokensResponse).to.deep.equal([]);
    });
  });

  context("with token accounts found", () => {
    context("with showRevoked false", () => {
      context("with a revoked account", () => {
        it("should return an empty array", async () => {
          sandbox.stub(connection, "getMultipleAccountsInfo").resolves([
            makeGTAccount(gatewayTokenAddresses[0], {
              revoked: new Revoked({}),
            }),
          ]);
          const findGatewayTokensResponse =
            await findGatewayTokensForOwnerAndNetwork(
              connection,
              owner,
              gatekeeperNetworkKey
            );
          expect(findGatewayTokensResponse).to.deep.equal([]);
        });
      });

      context("with a valid account", () => {
        it("should return an array with a gateway token", async () => {
          sandbox
            .stub(connection, "getMultipleAccountsInfo")
            .resolves([makeGTAccount()]);

          const findGatewayTokensResponse =
            await findGatewayTokensForOwnerAndNetwork(
              connection,
              owner,
              gatekeeperNetworkKey
            );
          expect(findGatewayTokensResponse.length).to.equal(1);
          expect(findGatewayTokensResponse[0]).to.deep.equal({
            issuingGatekeeper: gatekeeperKey,
            gatekeeperNetwork: gatekeeperNetworkKey,
            owner,
            state: State.ACTIVE,
            programId: new PublicKey(PROGRAM_ID.toBase58()), // Key has to be re-constructed here for deep.eq to work.
            publicKey: gatewayTokenAddresses[0],
            expiryTime: undefined,
          });
        });
      });
    });

    context("with showRevoked true", () => {
      context("with a revoked account", () => {
        it("should return an array with the revoked account marked as isValid false", async () => {
          sandbox.stub(connection, "getMultipleAccountsInfo").resolves([
            makeGTAccount(gatewayTokenAddresses[0], {
              revoked: new Revoked({}),
            }),
          ]);
          const findGatewayTokensResponse =
            await findGatewayTokensForOwnerAndNetwork(
              connection,
              owner,
              gatekeeperNetworkKey,
              true
            );
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperNetwork: gatekeeperNetworkKey,
              owner,
              state: State.REVOKED,
              publicKey: gatewayTokenAddresses[0],
              programId: PROGRAM_ID,
            },
          ]);
        });
      });

      context("with a valid account and a revoked account", () => {
        it("should return an array with the valid and revoked gateway tokens, with the valid one first", async () => {
          const revokedGatewayTokenAddress = gatewayTokenAddresses[0];
          const validGatewayTokenAddress = gatewayTokenAddresses[1];

          sandbox.stub(connection, "getMultipleAccountsInfo").resolves([
            // Revoked account is returned first from the RPC
            makeGTAccount(revokedGatewayTokenAddress, {
              revoked: new Revoked({}),
            }),
            makeGTAccount(validGatewayTokenAddress),
          ]);

          const findGatewayTokensResponse =
            await findGatewayTokensForOwnerAndNetwork(
              connection,
              owner,
              gatekeeperNetworkKey,
              true
            );
          expect(findGatewayTokensResponse.length).to.eq(2);
          expect(findGatewayTokensResponse).to.containSubset([
            {
              gatekeeperNetwork: gatekeeperNetworkKey,
              issuingGatekeeper: gatekeeperKey,
              owner,
              state: State.ACTIVE,
              publicKey: validGatewayTokenAddress,
              programId: PROGRAM_ID,
            },
            {
              gatekeeperNetwork: gatekeeperNetworkKey,
              issuingGatekeeper: gatekeeperKey,
              owner,
              state: State.REVOKED,
              publicKey: revokedGatewayTokenAddress,
              programId: PROGRAM_ID,
            },
          ]);
        });
      });
    });
  });

  context("with expired accounts", () => {
    it("should return valid accounts first", async () => {
      const expiredGatewayTokenAddress = gatewayTokenAddresses[0];
      const validGatewayTokenAddress = gatewayTokenAddresses[1];

      sandbox.stub(connection, "getMultipleAccountsInfo").resolves([
        // Expired account is returned first from the RPC
        makeGTAccount(
          expiredGatewayTokenAddress,
          undefined,
          Math.floor(Date.now() / 1000) - 10_000 // expired 10s ago
        ),
        makeGTAccount(
          validGatewayTokenAddress,
          undefined,
          Math.floor(Date.now() / 1000) + 10_000 // expires in 10s
        ),
      ]);

      const findGatewayTokensResponse =
        await findGatewayTokensForOwnerAndNetwork(
          connection,
          owner,
          gatekeeperNetworkKey,
          true
        );
      expect(findGatewayTokensResponse.length).to.equal(2);
      expect(findGatewayTokensResponse[0].publicKey.toBase58()).to.equal(
        validGatewayTokenAddress.toBase58()
      );
      expect(findGatewayTokensResponse[1].publicKey.toBase58()).to.equal(
        expiredGatewayTokenAddress.toBase58()
      );
    });
  });

  context("with pagination", () => {
    it("should request 100 accounts if the page size is 100", async () => {
      const expectsFirst100AccountsRequested = sandbox
        .mock(connection)
        .expects("getMultipleAccountsInfo")
        .once()
        .withArgs(matchesPubkeyArray(gatewayTokenAddresses), SOLANA_COMMITMENT);

      expectsFirst100AccountsRequested.resolves(R.times(() => null, 100));

      await findGatewayTokensForOwnerAndNetwork(
        connection,
        owner,
        gatekeeperNetworkKey,
        true,
        0,
        100
      );

      expectsFirst100AccountsRequested.verify();
    });

    it("should request 10 accounts if the page size is 10", async () => {
      const expectsFirst10AccountsRequested = sandbox
        .mock(connection)
        .expects("getMultipleAccountsInfo")
        .once()
        .withArgs(
          matchesPubkeyArray(gatewayTokenAddresses.slice(0, 10)),
          SOLANA_COMMITMENT
        );
      expectsFirst10AccountsRequested.resolves(R.times(() => null, 10));

      await findGatewayTokensForOwnerAndNetwork(
        connection,
        owner,
        gatekeeperNetworkKey,
        true,
        0,
        10
      );

      expectsFirst10AccountsRequested.verify();
    });

    it("should request the second 10 accounts if the page size is 10 and offset is 10", async () => {
      const expectsSecond10AccountsRequested = sandbox
        .mock(connection)
        .expects("getMultipleAccountsInfo")
        .once()
        .withArgs(
          matchesPubkeyArray(gatewayTokenAddresses.slice(10, 20)),
          SOLANA_COMMITMENT
        );
      expectsSecond10AccountsRequested.resolves(R.times(() => null, 10));

      await findGatewayTokensForOwnerAndNetwork(
        connection,
        owner,
        gatekeeperNetworkKey,
        true,
        10,
        10
      );

      expectsSecond10AccountsRequested.verify();
    });
  });
});
