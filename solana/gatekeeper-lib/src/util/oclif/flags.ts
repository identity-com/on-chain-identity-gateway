import { Keypair, PublicKey } from "@solana/web3.js";
import { flags } from "@oclif/command";
import { readKey } from "../account";
import { ExtendedCluster } from "../connection";

export const gatekeeperKeyFlag = flags.build<Keypair>({
  char: "g",
  parse: readKey,
  default: () => readKey(`${__dirname}/test-gatekeeper.json`),
  description: "The private key file for the gatekeeper authority",
});
export const gatekeeperNetworkKeyFlag = flags.build<Keypair>({
  char: "n",
  parse: readKey,
  default: () => readKey(`${__dirname}/test-gatekeeper-network.json`),
  description: "The private key file for the gatekeeper authority",
});
export const gatekeeperNetworkPubkeyFlag = flags.build<PublicKey>({
  char: "n",
  parse: (pubkey: string) => new PublicKey(pubkey),
  default: () => readKey(`${__dirname}/test-gatekeeper-network.json`).publicKey,
  description:
    "The public key (in base 58) of the gatekeeper network that the gatekeeper belongs to.",
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
  default: "mainnet-beta" as ExtendedCluster,
  description:
    "The cluster to target: mainnet-beta (default), testnet, devnet, civicnet, localnet. Alternatively, set the environment variable SOLANA_CLUSTER",
});
