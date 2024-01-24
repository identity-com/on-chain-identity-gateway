import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";
import {
  airdropFlag,
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/flags";
import { getTokenUpdateProperties } from "../util/utils";

export default class Burn extends Command {
  static description = "Burns a gateway token";

  static examples = [
    `$ gateway burn EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Burned
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
      description: "The gateway token to burn",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Burn);

    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Burning:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    await service
      .burn(gatewayToken)
      .then((t) => t.send())
      .then((t) => t.confirm());

    this.log("Burned");
  }
}
