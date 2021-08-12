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
    `$ gateway freeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Frozen
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
  ];

  async run() {
    const { args, flags } = this.parse(Freeze);

    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Freezing:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    const token = await service.freeze(gatewayToken);

    this.log("Frozen token", token.publicKey.toBase58());
  }
}
