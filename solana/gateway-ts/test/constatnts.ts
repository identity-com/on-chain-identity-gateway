import { clusterApiUrl } from "@solana/web3.js";

function get_validator_url(cluster: string | undefined): string {
  if (cluster === undefined) {
    return "http://localhost:8899/";
  }
  if (
    cluster === "devnet" ||
    cluster == "testnet" ||
    cluster == "mainnet-beta"
  ) {
    return clusterApiUrl(cluster);
  }
  throw new Error("Unknown cluster: " + cluster);
}

export const VALIDATOR_URL = get_validator_url(process.env.CLUSTER);
