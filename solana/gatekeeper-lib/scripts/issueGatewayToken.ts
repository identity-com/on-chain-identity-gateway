import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { GatekeeperService } from "../src";
import { homedir } from "os";
import * as path from "path";

const gatekeeperKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  "G1y4BUXnbSMsdcXbCTMEdRWW9Th9tU9WfAmgbPDX7rRG.json"
));
const gatekeeper = Keypair.fromSecretKey(Buffer.from(gatekeeperKey));

const gatekeeperNetworkKey = new PublicKey(
  "tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf"
);

const endpoint = clusterApiUrl("devnet");
const connection = new Connection(endpoint, SOLANA_COMMITMENT);

const gatekeeperService = new GatekeeperService(
  connection,
  gatekeeperNetworkKey,
  gatekeeper
);

(async function () {
  const owner = Keypair.generate().publicKey;

  const { blockhash } = await connection.getRecentBlockhash(SOLANA_COMMITMENT);
  const issuedToken = await gatekeeperService.issue(owner, {
    blockhashOrNonce: { recentBlockhash: blockhash },
  });

  const serializedTx = issuedToken.transaction.serialize();
  console.log("serializedTx", serializedTx.toString("base64"));

  const txSig = await connection.sendRawTransaction(serializedTx);
  await connection.confirmTransaction(txSig);
})().catch((error) => console.error(error));
