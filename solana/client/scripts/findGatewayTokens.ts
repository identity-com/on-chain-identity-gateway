import { homedir } from "os";
import * as path from "path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { GatewayTokenData } from "../src/solana/GatewayTokenData";
import { findGatewayTokens } from "../src";

// Should equal the contents of solana/program/program-id.md
export const PROGRAM_ID: PublicKey = new PublicKey(
  "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
);
const GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET = 2;

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

// Gatekeeper Network
const gatekeeperNetworkKey = new PublicKey(
  "48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv"
);

(async function () {
  console.log("My pubkey as a byte array: ", myKeypair.publicKey.toBuffer());
  const accounts = await findGatewayTokens(
    connection,
    myKeypair.publicKey,
    gatekeeperNetworkKey
  );
  console.log("Found Accounts");
  console.log(accounts);
})().catch((error) => console.error(error));
