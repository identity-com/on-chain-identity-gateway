import { Keypair, Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";

export const MIN_AIRDROP_BALANCE = 100000000;
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const airdropTo = async (
  connection: Connection,
  publicKey: PublicKey,
  clusterUrl: string,
  lamports = MIN_AIRDROP_BALANCE
) => {
  const balance = await connection.getBalance(publicKey);
  if (balance > MIN_AIRDROP_BALANCE) return;
  if (clusterUrl === clusterApiUrl("mainnet-beta")) return;

  // eslint-disable-next-line no-console
  console.log(`Airdropping to ${publicKey.toBase58()}...`);
  let retries = 30;
  await connection.requestAirdrop(publicKey, lamports);
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(500);
    // eslint-disable-next-line no-await-in-loop
    const balance = await connection.getBalance(publicKey);
    if (balance >= lamports) {
      // eslint-disable-next-line no-console
      console.log("Airdrop done");
      return;
    }
    if (--retries <= 0) {
      break;
    }
  }
  throw new Error(`Airdrop of ${lamports} failed`);
};

export const readKey = (file: string): Keypair =>
  Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(file).toString("utf-8")))
  );
