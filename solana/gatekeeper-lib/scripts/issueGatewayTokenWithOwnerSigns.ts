import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { airdropTo, GatekeeperService } from "../src";
import { homedir } from "os";
import * as path from "path";

const LAMPORTS_FOR_ISSUANCE = 2_000_000; // The owner needs this much to issue their own token.

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

const owner = Keypair.generate();
const endpoint = clusterApiUrl("devnet");
const connection = new Connection(endpoint, SOLANA_COMMITMENT);

const gatekeeperService = new GatekeeperService(
  connection,
  gatekeeperNetworkKey,
  gatekeeper,
  {
    rentPayer: owner.publicKey,
  }
);

console.log("Issuing gateway token for " + owner.publicKey);

(async function () {
  await airdropTo(
    connection,
    owner.publicKey,
    clusterApiUrl("devnet"),
    LAMPORTS_FOR_ISSUANCE
  );
  const { blockhash } = await connection.getRecentBlockhash(SOLANA_COMMITMENT);

  //  Creates a transaction signed by the gatekeeper only
  const sendableTx = await gatekeeperService.issue(owner.publicKey, {
    blockhashOrNonce: { recentBlockhash: blockhash },
  });

  // simulate serializing and sending to the frontend (do not verify sigs as not all sigs are present yet).
  const serializedTx = sendableTx.transaction
    .serialize({ verifySignatures: false })
    .toString("base64");
  console.log("serializedTx", serializedTx);

  // simulate deserializing and signing
  const deserializedTx = Transaction.from(Buffer.from(serializedTx, "base64"));
  deserializedTx.partialSign(owner);

  const txSig = await connection.sendRawTransaction(deserializedTx.serialize());
  console.log("txSig", txSig);
  await connection.confirmTransaction(txSig);
  console.log("confirmed");
})().catch((error) => console.error(error));
