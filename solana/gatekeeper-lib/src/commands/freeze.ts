import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";
import {
  authorityKeypairFlag,
  clusterFlag,
  gatekeeperNetworkPublicKeyFlag,
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
    help: Flags.help({ char: "h" }),
    gatekeeperKeypair: authorityKeypairFlag(),
    gatekeeperNetworkPublicKey: gatekeeperNetworkPublicKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "gatewayToken",
      required: true,
      description: "The gateway token to freeze",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Freeze);

    // ? Error here with flags in getTokenUpdateProperties()?
    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Freezing:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    const frozenToken = await service
      .freeze(gatewayToken)
      .then((t) => t.send())
      .then((t) => t.confirm());

    this.log("Frozen token", frozenToken?.publicKey.toBase58());
  }
}
