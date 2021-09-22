import { Keypair, PublicKey } from "@casper/web3.js";
import { getConnection } from "../connection";
import { airdropTo } from "../account";
import { GatekeeperService } from "../../service";

export const getTokenUpdateProperties = async (
  args: { [p: string]: any },
  flags: {
    gatekeeperNetworkKey: PublicKey | undefined;
    help: void;
    cluster: string | undefined;
    gatekeeperKey: Keypair | undefined;
  }
) => {
  const gatewayToken: PublicKey = args.gatewayToken;
  const gatekeeper = flags.gatekeeperKey as Keypair;
  const gatekeeperNetwork = flags.gatekeeperNetworkKey as PublicKey;

  const connection = getConnection(flags.cluster);
  await airdropTo(connection, gatekeeper.publicKey, flags.cluster as string);
  const service = new GatekeeperService(
    connection,
    gatekeeper,
    gatekeeperNetwork,
    gatekeeper
  );
  return { gatewayToken, gatekeeper, service };
};
