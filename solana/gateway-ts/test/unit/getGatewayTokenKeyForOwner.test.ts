import chai from "chai";
import chaiSubset from "chai-subset";
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import {
  addGatekeeper,
  getGatekeeperAccountAddress,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
  issueVanilla,
} from "../../src";
import { VALIDATOR_URL } from "../constants";

chai.use(chaiSubset);
const { expect } = chai;

describe("getGatewayTokenKeyForOwner", function () {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperAuthority: Keypair;
  let gatekeeperAccount: PublicKey;
  let gatekeeperNetwork: Keypair;
  let payer: Keypair;

  beforeEach(async () => {
    owner = Keypair.generate().publicKey;
    gatekeeperAuthority = Keypair.generate();
    gatekeeperNetwork = Keypair.generate();
    gatekeeperAccount = await getGatekeeperAccountAddress(
      gatekeeperAuthority.publicKey,
      gatekeeperNetwork.publicKey
    );
  });

  it("get token address with wrong size seed should fail", () => {
    const shouldFail = () =>
      getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        owner,
        gatekeeperNetwork.publicKey,
        1e50
      );
    expect(shouldFail).to.throw("index must be < max(8 bytes)");
  });

  // TODO move into a separate suite
  context("integration", () => {
    before(async () => {
      connection = new Connection(VALIDATOR_URL);
      payer = Keypair.generate();
      await connection.confirmTransaction(
        await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );
    });

    it("should add gateway token", async () => {
      const transaction = await connection.confirmTransaction(
        await connection.sendTransaction(
          new Transaction({
            feePayer: payer.publicKey,
          })
            .add(
              addGatekeeper(
                payer.publicKey,
                gatekeeperAccount,
                gatekeeperAuthority.publicKey,
                gatekeeperNetwork.publicKey
              )
            )
            .add(
              issueVanilla(
                await getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
                  owner,
                  gatekeeperNetwork.publicKey
                ),
                payer.publicKey,
                gatekeeperAccount,
                owner,
                gatekeeperAuthority.publicKey,
                gatekeeperNetwork.publicKey
              )
            ),
          [payer, gatekeeperNetwork, gatekeeperAuthority],
          {
            preflightCommitment: "confirmed",
          }
        ),
        "confirmed"
      );

      expect(transaction.value.err).to.be.null;
    });
  });
});
