import { homedir } from "os";
import * as path from "path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { findGatewayTokens, GatewayToken } from "../src";

/**
 * Find gateway tokens for a particular wallet
 *
 * usage:
 *
 * yarn ts-node scripts/findGatewayTokens <PUBKEY>
 */

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
  "http://ec2-3-238-152-85.compute-1.amazonaws.com:8899";

const connection = new Connection(endpoint, "processed");

// Default Gatekeeper Network
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
  const owner = new PublicKey("5fSLGjW8FCHpJPG1N93Af6QZew9HUb25pyn9Gas2sxyL");
  console.log(
    `Gateway tokens for: ${owner.toBase58()} under gatekeeper network ${gatekeeperNetworkKey.toBase58()}`
  );
  const accounts = await findGatewayTokens(
    connection,
    owner,
    gatekeeperNetworkKey
  );
  console.log("Found Accounts");
  console.log(accounts.map(prettyPrint));
})().catch((error) => console.error(error));
