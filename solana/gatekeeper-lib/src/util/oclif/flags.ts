import { Keypair, PublicKey } from "@solana/web3.js";
import { Flags } from "@oclif/core";
import { readKey } from "../account";
import { ExtendedCluster } from "../connection";

export const gatekeeperKeyFlag = Flags.build<Keypair>({
  char: "g",
  parse: readKey,
  // eslint-disable-next-line unicorn/prefer-module
  default: async () => readKey(`${__dirname}/test-gatekeeper.json`),
  description: "The private key file for the gatekeeper authority",
});
export const gatekeeperNetworkKeyFlag = Flags.build<Keypair>({
  char: "n",
  parse: readKey,
  // eslint-disable-next-line unicorn/prefer-module
  default: async () => readKey(`${__dirname}/test-gatekeeper-network.json`),
  description: "The private key file for the gatekeeper authority",
});
export const gatekeeperNetworkPubkeyFlag = Flags.build<PublicKey>({
  char: "n",
  // eslint-disable-next-line @typescript-eslint/require-await
  parse: async (pubkey: string) => new PublicKey(pubkey),
  default: async () =>
    // eslint-disable-next-line unicorn/prefer-module
    (await readKey(`${__dirname}/test-gatekeeper-network.json`)).publicKey,
  description:
    "The public key (in base 58) of the gatekeeper network that the gatekeeper belongs to.",
});
export const clusterFlag = Flags.build<ExtendedCluster>({
  // eslint-disable-next-line @typescript-eslint/require-await
  parse: async (cluster: string) => {
    if (process.env.SOLANA_CLUSTER_URL) {
      const error = process.env.SOLANA_CLUSTER
        ? new Error("Cannot specify both SOLANA_CLUSTER and SOLANA_CLUSTER_URL")
        : new Error(
            "Cannot specify the cluster flag if SOLANA_CLUSTER_URL is set"
          );
      throw error;
    }

    return cluster as ExtendedCluster;
  },
  options: ["mainnet-beta", "testnet", "devnet", "civicnet", "localnet"],
  char: "c",
  env: "SOLANA_CLUSTER",
  default: "mainnet-beta" as ExtendedCluster,
  description:
    "The cluster to target. Alternatively, set the environment variable SOLANA_CLUSTER. To override this property with a specific endpoint url, set SOLANA_CLUSTER_URL",
});
