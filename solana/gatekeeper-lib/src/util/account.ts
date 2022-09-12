import { Keypair, Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
// Not supported before v18
// eslint-disable-next-line unicorn/prefer-node-protocol
import * as fs from "fs";

export const MIN_AIRDROP_BALANCE = 100_000_000;
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const airdropTo = async (
  connection: Connection,
  publicKey: PublicKey,
  clusterUrl: string,
  lamports = MIN_AIRDROP_BALANCE
): Promise<void> => {
  const balance = await connection.getBalance(publicKey);
  if (balance > MIN_AIRDROP_BALANCE) return;
  if (clusterUrl === clusterApiUrl("mainnet-beta")) return;

  console.log(`Airdropping to ${publicKey.toBase58()}...`);
  let retries = 30;
  await connection.requestAirdrop(publicKey, lamports);
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(500);
    // eslint-disable-next-line no-await-in-loop
    const balance = await connection.getBalance(publicKey);
    if (balance >= lamports) {
      console.log("Airdrop done");
      return;
    }

    if (--retries <= 0) {
      break;
    }
  }

  throw new Error(`Airdrop of ${lamports} failed`);
};

// eslint-disable-next-line @typescript-eslint/require-await
export const readKey = async (file: string): Promise<Keypair> =>
  Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(file).toString("utf-8")))
  );
