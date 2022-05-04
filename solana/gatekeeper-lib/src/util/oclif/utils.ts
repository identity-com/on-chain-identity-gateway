import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { ExtendedCluster, getClusterUrl, getConnection } from "../connection";
import { airdropTo } from "../account";
import { GatekeeperService } from "../../service";

export const getTokenUpdateProperties = async (
  args: { [p: string]: any },
  flags: {
    gatekeeperNetworkPublicKey: PublicKey | undefined;
    help: void;
    cluster: ExtendedCluster | undefined;
    gatekeeperKeypair: Keypair | undefined;
  }
): Promise<{
  gatewayToken: PublicKey;
  gatekeeper: Keypair;
  service: GatekeeperService;
}> => {
  const gatewayToken: PublicKey = args.gatewayToken as PublicKey;
  const gatekeeper = flags.gatekeeperKeypair as Keypair;
  const gatekeeperNetwork = flags.gatekeeperNetworkPublicKey as PublicKey;

  const connection = getConnectionFromEnv(flags.cluster);
  await airdropTo(connection, gatekeeper.publicKey, flags.cluster as string);
  const service = new GatekeeperService(
    connection,
    gatekeeperNetwork,
    gatekeeper
  );
  return { gatewayToken, gatekeeper, service };
};

/**
 * If SOLANA_CLUSTER_URL is set, create a connection to it
 * Otherwise, create a connection to the passed-in cluster
 * @param cluster ExtendedCluster
 *
 * @returns Connection
 */
export const getConnectionFromEnv = (cluster?: ExtendedCluster): Connection => {
  if (process.env.SOLANA_CLUSTER_URL)
    return getConnection(process.env.SOLANA_CLUSTER_URL);

  if (!cluster)
    throw new Error("Either pass a cluster or set SOLANA_CLUSTER_URL");

  return getConnection(getClusterUrl(cluster));
};
