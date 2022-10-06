import chai from "chai";
import chaiSubset from "chai-subset";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import {
  addGatekeeper,
  GatewayToken,
  getGatekeeperAccountAddress,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
  issueVanilla,
  onGatewayToken,
} from "../../src";
import { VALIDATOR_URL } from "../constants";

chai.use(chaiSubset);

describe("onGatewayToken", () => {
  const connection = new Connection(VALIDATOR_URL, "processed");
  const owner = Keypair.generate().publicKey;
  const gatekeeperAuthority = Keypair.generate();
  const gatekeeperNetwork = Keypair.generate();

  const gatekeeperAccount = getGatekeeperAccountAddress(
    gatekeeperAuthority.publicKey,
    gatekeeperNetwork.publicKey
  );
  const payer = Keypair.generate();

  before(async function () {
    this.timeout(10_000);
    // airdrop to payer
    await connection.confirmTransaction({
      signature: await connection.requestAirdrop(
        payer.publicKey,
        LAMPORTS_PER_SOL
      ),
      ...(await connection.getLatestBlockhash()),
    });

    // add the gatekeeper to the gatekeeper network
    const addGatekeeperTx = new Transaction({
      feePayer: payer.publicKey,
    }).add(
      addGatekeeper(
        payer.publicKey,
        gatekeeperAccount,
        gatekeeperAuthority.publicKey,
        gatekeeperNetwork.publicKey
      )
    );

    await connection.confirmTransaction({
      signature: await connection.sendTransaction(addGatekeeperTx, [
        payer,
        gatekeeperNetwork,
      ]),
      ...(await connection.getLatestBlockhash()),
    });
  });

  it("should listen to created tokens", async () => {
    // The promise will resolve when the token is created
    let heardCreationCallback: (token: GatewayToken) => void = () => {};
    const heardCreation = new Promise((resolve) => {
      heardCreationCallback = resolve;
    });

    // register the listener
    const subscriptionId = onGatewayToken(
      connection,
      owner,
      gatekeeperNetwork.publicKey,
      heardCreationCallback
    );

    // issue the token
    const issueGTTransaction = new Transaction({
      feePayer: payer.publicKey,
    }).add(
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
    );
    await connection.confirmTransaction({
      signature: await connection.sendTransaction(issueGTTransaction, [
        payer,
        gatekeeperAuthority,
      ]),
      ...(await connection.getLatestBlockhash()),
    });

    // wait for the listener to be triggered
    await heardCreation;

    // drop the subscription
    await connection.removeAccountChangeListener(subscriptionId);
  });
});
