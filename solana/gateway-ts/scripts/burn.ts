import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  burn,
  expireToken,
  findGatewayToken,
  getGatekeeperAccountAddress,
  getGatewayToken,
} from "../src";
import * as os from "os";

const gatewayToken = new PublicKey(process.argv[2]);
const keypair = Keypair.fromSecretKey(
  Buffer.from(require(os.homedir() + "/.config/solana/id.json"))
);
const gatekeeperNetwork = new PublicKey(
  "tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf"
);
const gatekeeperKey = Keypair.fromSecretKey(
  Buffer.from(
    require("/Users/daniel/code/identity-com/on-chain-identity-gateway/solana/gatekeeper-cli/src/util/test-gatekeeper.json")
  )
);

(async () => {
  const endpoint = process.env.CLUSTER_ENDPOINT || clusterApiUrl("devnet");
  const connection = new Connection(endpoint, "confirmed");

  const token = await getGatewayToken(connection, gatewayToken);

  console.log(token);

  if (!token) throw new Error("Token not found");

  console.log("gatekeeperNetwork", token.gatekeeperNetwork.toBase58());

  const gatekeeperAccount = getGatekeeperAccountAddress(
    token.issuingGatekeeper,
    gatekeeperNetwork
  );

  const instruction = burn(
    gatewayToken,
    token.issuingGatekeeper,
    gatekeeperAccount,
    keypair.publicKey
  );

  const tx = await connection.sendTransaction(
    new Transaction().add(instruction),
    [gatekeeperKey]
  );

  console.log(tx);
})().catch(console.error);
