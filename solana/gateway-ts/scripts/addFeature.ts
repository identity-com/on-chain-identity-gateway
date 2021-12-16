import { homedir } from "os";
import * as path from "path";
import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const cluster = (process.env.CLUSTER || "mainnet-beta") as Cluster;
const connection = new Connection(clusterApiUrl(cluster), "processed");

const gatekeeperNetworkKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  "ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6.json"
));
const gatekeeperNetwork = Keypair.fromSecretKey(
  Buffer.from(gatekeeperNetworkKey)
);

(async function () {
  const gatewayProgram = new PublicKey(
    "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
  );
  const [featureAccount, bump] = await PublicKey.findProgramAddress(
    [gatekeeperNetwork.publicKey.toBytes(), Buffer.from("expire", "utf8")],
    gatewayProgram
  );
  const addToGknInstruction = new TransactionInstruction({
    keys: [
      { pubkey: gatekeeperNetwork.publicKey, isSigner: true, isWritable: true }, // funder
      {
        pubkey: gatekeeperNetwork.publicKey,
        isSigner: true,
        isWritable: false,
      }, // gatekeeper_network
      {
        pubkey: featureAccount,
        isSigner: false,
        isWritable: true,
      }, // feature_account
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      }, // system program
    ],
    data: Buffer.from([5, 0]),
    programId: gatewayProgram,
  });

  const { blockhash: recentBlockhash } = await connection.getRecentBlockhash();
  const tx = new Transaction({ recentBlockhash }).add(addToGknInstruction);

  const txSig = await connection.sendTransaction(tx, [gatekeeperNetwork]);

  console.log("Transaction signature: ", txSig);
})().catch((error) => console.error(error));
