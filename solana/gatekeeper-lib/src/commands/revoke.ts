import { Command, flags } from "@oclif/command";
import { PublicKey } from "@solana/web3.js";
import {
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkKeyFlag,
} from "../util/oclif/flags";
import { getTokenUpdateProperties } from "../util/oclif/utils";

export default class Revoke extends Command {
  static description = "Revoke a gateway token";

  static examples = [
    `$ gateway revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Revoked
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "gatewayToken",
      required: true,
      description: "The gateway token to revoke",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Revoke);

    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Revoking:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    const token = await service.revoke(gatewayToken);

    this.log("Revoked");
  }
}
