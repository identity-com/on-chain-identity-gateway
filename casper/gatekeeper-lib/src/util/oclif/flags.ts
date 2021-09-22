import { Keypair, PublicKey } from "@casper/web3.js";
import { flags } from "@oclif/command";
import { readKey } from "../account";
import { getClusterUrl } from "../connection";

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
export const clusterFlag = flags.build<string>({
  char: "c",
  env: "SOLANA_CLUSTER",
  parse: getClusterUrl,
  default: () => getClusterUrl("civicnet"),
  description:
    "The cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet. Alternatively, set the environment variable SOLANA_CLUSTER",
});
