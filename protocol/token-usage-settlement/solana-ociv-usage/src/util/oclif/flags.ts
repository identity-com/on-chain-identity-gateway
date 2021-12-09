import { Keypair, PublicKey } from "@solana/web3.js";
import { flags } from "@oclif/command";
import { readKey } from "../account";
import { getClusterUrl } from "../connection";

export const oracleKeyFlag = flags.build<Keypair>({
  char: "o",
  parse: readKey,
  description: "The private key file for the oracle authority",
});

export const clusterFlag = flags.build<string>({
  char: "c",
  env: "SOLANA_CLUSTER",
  parse: getClusterUrl,
  default: () => getClusterUrl("civicnet"),
  description:
    "The cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet. Alternatively, set the environment variable SOLANA_CLUSTER",
});
