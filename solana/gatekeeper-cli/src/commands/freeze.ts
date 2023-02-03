import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";
import {
  airdropFlag,
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/flags";
import { getTokenUpdateProperties } from "../util/utils";

export default class Freeze extends Command {
  static description = "Freeze a gateway token";

  static examples = [
    `$ gateway freeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Frozen
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkPubkeyFlag(),
    cluster: clusterFlag(),
    airdrop: airdropFlag,
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
