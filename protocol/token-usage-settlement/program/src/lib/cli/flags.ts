import { web3 } from "@project-serum/anchor";

import { flags } from "@oclif/command";
import { ExtendedCluster } from "../util";

export const pubkeyFlag = flags.build<web3.PublicKey>({
  parse: (pubkey: string) => new web3.PublicKey(pubkey),
});

export const clusterFlag = flags.build<ExtendedCluster>({
  parse: (cluster: string) => {
    if (process.env.SOLANA_CLUSTER_URL) {
      if (process.env.SOLANA_CLUSTER) {
        throw new Error(
          "Cannot specify both SOLANA_CLUSTER and SOLANA_CLUSTER_URL"
        );
      } else {
        throw new Error(
          "Cannot specify the cluster flag if SOLANA_CLUSTER_URL is set"
        );
      }
    }
    return cluster as ExtendedCluster;
  },
  options: ["mainnet-beta", "testnet", "devnet", "civicnet", "localnet"],
  char: "c",
  env: "SOLANA_CLUSTER",
  default: "devnet" as ExtendedCluster,
  description:
    "The cluster to target. Alternatively, set the environment variable SOLANA_CLUSTER. To override this property with a specific endpoint url, set SOLANA_CLUSTER_URL",
});
