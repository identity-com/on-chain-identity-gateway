import { web3, Provider, Wallet, setProvider } from "@project-serum/anchor";
import * as fs from "fs";
import path from "path";
import * as os from "os";
import { ExtendedCluster, getClusterUrl } from "../util";

const WALLET_PATH =
  process.env.USAGE_WALLET ||
  path.join(os.homedir(), ".config", "solana", "id.json");
const DEFAULT_COMMITMENT: web3.Commitment = "confirmed";

export const getKeypair = (): web3.Keypair =>
  web3.Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        fs.readFileSync(WALLET_PATH, {
          encoding: "utf-8",
        })
      )
    )
  );

export const initProvider = (cluster: ExtendedCluster) => {
  const connection = new web3.Connection(
    getClusterUrl(cluster),
    DEFAULT_COMMITMENT
  );
  const wallet = new Wallet(getKeypair());
  const provider = new Provider(connection, wallet, {
    commitment: DEFAULT_COMMITMENT,
  });
  setProvider(provider);
  return provider;
};
