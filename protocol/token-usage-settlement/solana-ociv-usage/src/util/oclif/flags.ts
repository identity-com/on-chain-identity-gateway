import { Keypair, PublicKey } from "@solana/web3.js";
import { Flags } from "@oclif/core";
import { readKey } from "../account";
import { ExtendedCluster, getClusterUrl } from "../connection";

export const oracleKeyFlag = Flags.build<Keypair>({
  char: "o",
  parse: async (file: string) => readKey(file),
  description: "The private key file for the oracle authority",
});

export const clusterFlag = Flags.build<string>({
  char: "c",
  env: "SOLANA_CLUSTER",
  parse: async (cluster: ExtendedCluster) => getClusterUrl(cluster),
  default: async () => getClusterUrl("civicnet"),
  description:
    "The cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet. Alternatively, set the environment variable SOLANA_CLUSTER",
});
