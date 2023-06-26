import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { expireToken, findGatewayToken, getGatewayToken } from "../src";
import * as os from "os";

const gatewayToken = new PublicKey(process.argv[2]);
const keypair = Keypair.fromSecretKey(
  Buffer.from(require(os.homedir() + "/.config/solana/id.json"))
);

(async () => {
  const endpoint = process.env.CLUSTER_ENDPOINT || clusterApiUrl("devnet");
  const connection = new Connection(endpoint, "confirmed");

  const token = await getGatewayToken(connection, gatewayToken);

  console.log(token);

  if (!token) throw new Error("Token not found");

  console.log("gatekeeperNetwork", token.gatekeeperNetwork.toBase58());

  const instruction = expireToken(
    gatewayToken,
    keypair.publicKey,
    token.gatekeeperNetwork
  );

  const tx = await connection.sendTransaction(
    new Transaction().add(instruction),
    [keypair]
  );

  console.log(tx);
})().catch(console.error);
