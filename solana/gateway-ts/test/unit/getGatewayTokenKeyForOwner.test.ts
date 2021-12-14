import chai from "chai";
import chaiSubset from "chai-subset";
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  GatewayTokenData,
  GatewayTokenState,
} from "../../src/lib/GatewayTokenData";
import { AssignablePublicKey } from "../../src/lib/AssignablePublicKey";
import {
  addGatekeeper,
  getGatekeeperAccountKey,
  getGatewayTokenKeyForOwner,
  issueVanilla,
} from "../../src";
import { VALIDATOR_URL } from "../constatnts";

chai.use(chaiSubset);
const { expect } = chai;
const getAccountWithState = (
  state: GatewayTokenState,
  pubkey: PublicKey,
  ownerKey: PublicKey,
  gatekeeperNetworkKey: PublicKey,
  gatekeeperKey: PublicKey
) => {
  const gtData = new GatewayTokenData({
    state,
    owner: AssignablePublicKey.fromPublicKey(ownerKey),
    issuingGatekeeper: AssignablePublicKey.fromPublicKey(gatekeeperKey),
    gatekeeperNetwork: AssignablePublicKey.fromPublicKey(gatekeeperNetworkKey),
    features: [0],
    parentGatewayToken: undefined,
    ownerIdentity: undefined,
    expiry: undefined,
  });
  return { pubkey, account: { data: gtData.encode() } };
};

describe("getGatewayTokenKeyForOwner", function () {
  let connection: Connection;
  let owner: PublicKey;
  let gatekeeperAuthority: Keypair;
  let gatekeeperAccount: PublicKey;
  let gatekeeperNetwork: Keypair;
  let payer: Keypair;

  before(async () => {
    connection = new Connection(VALIDATOR_URL);
    payer = Keypair.generate();
    await connection.confirmTransaction(
      await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL),
      "confirmed"
    );
  });

  beforeEach(async () => {
    owner = Keypair.generate().publicKey;
    gatekeeperAuthority = Keypair.generate();
    gatekeeperNetwork = Keypair.generate();
    gatekeeperAccount = await getGatekeeperAccountKey(
      gatekeeperAuthority.publicKey,
      gatekeeperNetwork.publicKey
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
              await getGatewayTokenKeyForOwner(
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

  it("get token address with wrong size seed should fail", async () => {
    try {
      await getGatewayTokenKeyForOwner(
        owner,
        gatekeeperNetwork.publicKey,
        new Uint8Array([100, 212])
      );
      expect.fail("Succeeded when should fail");
    } catch (error) {
      expect((error as Error).message).to.deep.equal(
        "Additional Seed has length 2 instead of 8 when calling getGatewayTokenKeyForOwner."
      );
    }
  });
});
