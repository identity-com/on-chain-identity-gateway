import { homedir } from "os";
import * as path from "path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { findGatewayTokens, GatewayToken } from "../src";

const mySecretKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  "id.json"
));
const myKeypair = Keypair.fromSecretKey(Buffer.from(mySecretKey));

// default to the civic cluster
const endpoint =
  process.env.CLUSTER_ENDPOINT ||
  "http://ec2-34-238-243-215.compute-1.amazonaws.com:8899";

const connection = new Connection(endpoint, "processed");

// Gatekeeper Network
const gatekeeperNetworkKey = new PublicKey(
  "48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv"
);

const prettyPrint = (gatewayToken: GatewayToken) => ({
  owner: gatewayToken.owner.toBase58(),
  gatekeeperNetwork: gatewayToken.gatekeeperNetwork.toBase58(),
  gatekeeper: gatewayToken.issuingGatekeeper.toBase58(),
  valid: gatewayToken.isValid,
});

(async function () {
  console.log("My pubkey as a byte array: ", myKeypair.publicKey.toBuffer());
  const accounts = await findGatewayTokens(
    connection,
    myKeypair.publicKey,
    gatekeeperNetworkKey
  );
  console.log("Found Accounts");
  console.log(accounts.map(prettyPrint));
})().catch((error) => console.error(error));
