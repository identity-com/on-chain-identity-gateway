import { web3 } from "@project-serum/anchor";

import { flags } from "@oclif/command";
import { ExtendedCluster } from "../util";

export const pubkeyFlag = flags.build<web3.PublicKey>({
  parse: (pubkey: string) => new web3.PublicKey(pubkey),
});

export const clusterFlag = flags.build<ExtendedCluster>({
  char: "c",
  env: "SOLANA_CLUSTER",
  parse: (cluster: string) => cluster as ExtendedCluster,
  default: () => "devnet",
  description:
    "The cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet. Alternatively, set the environment variable SOLANA_CLUSTER",
});
