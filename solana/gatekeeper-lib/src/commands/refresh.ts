import { Command, flags } from "@oclif/command";
import { PublicKey } from "@solana/web3.js";
import {
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/oclif/flags";
import { getTokenUpdateProperties } from "../util/oclif/utils";

export default class Freeze extends Command {
  static description = "Freeze a gateway token";

  static examples = [
    `$ gateway refresh EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv 54000
Refreshed
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkPubkeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "gatewayToken",
      required: true,
      description: "The gateway token to freeze",
      parse: (input: string) => new PublicKey(input),
    },
    {
      name: "expiry",
      description:
        "The new expiry time in seconds for the gateway token (default 15 minutes)",
      default: 15 * 60 * 60, // 15 minutes
      parse: (input: string) => Number(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Freeze);

    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Refreshing:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    const token = await service.updateExpiry(
      gatewayToken,
      args.expiry + Math.floor(Date.now() / 1000)
    );

    this.log("Refreshed");
  }
}
