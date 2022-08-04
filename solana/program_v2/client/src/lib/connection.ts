import { Cluster } from "@solana/web3.js";

export type ExtendedCluster = Cluster | 'localnet' | 'civicnet';