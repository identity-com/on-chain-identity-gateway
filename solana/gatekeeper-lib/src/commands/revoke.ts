import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";
import {
  airdropFlag,
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
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
      description: "The gateway token to revoke",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Revoke);

    const { gatewayToken, gatekeeper, service } =
      await getTokenUpdateProperties(args, flags);

    this.log(`Revoking:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    await service
      .revoke(gatewayToken)
      .then((t) => t.send())
      .then((t) => t.confirm());

    this.log("Revoked");
  }
}
