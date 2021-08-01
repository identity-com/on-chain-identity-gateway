import { Keypair, PublicKey } from "@solana/web3.js";
import { getConnection } from "../connection";
import { airdropTo } from "../account";
import { GatekeeperService } from "../../service";

export const getTokenUpdateProperties = async (
  args: { [p: string]: any },
  flags: {
    gatekeeperNetworkKey: Keypair | undefined;
    help: void;
    cluster: string | undefined;
    gatekeeperKey: Keypair | undefined;
  }
) => {
  const gatewayToken: PublicKey = args.gatewayToken;
  const gatekeeper = flags.gatekeeperKey as Keypair;
  const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;

  const connection = getConnection(flags.cluster);
  await airdropTo(
    connection,
    gatekeeperNetwork.publicKey,
    flags.cluster as string
  );
  const service = new GatekeeperService(
    connection,
    gatekeeperNetwork,
    gatekeeperNetwork.publicKey,
    gatekeeper
  );
  return { gatewayToken, gatekeeper, service };
};
