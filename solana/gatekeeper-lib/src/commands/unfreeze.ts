import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";
import {
  airdropFlag,
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/oclif/flags";
import { getTokenUpdateProperties } from "../util/oclif/utils";

export default class Unfreeze extends Command {
  static description = "Unfreeze a gateway token";

  static examples = [
    `$ gateway unfreeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Unfrozen
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
      description: "The gateway token to unfreeze",
      parse: (input: string): Promise<PublicKey> =>
        Promise.resolve(new PublicKey(input)),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Unfreeze);

    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Unfreezing:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    await service
      .unfreeze(gatewayToken)
      .then((t) => t.send())
      .then((t) => t.confirm());

    this.log("Unfrozen");
  }
}
