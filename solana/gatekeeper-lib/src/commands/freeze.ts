import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";
import { airdropTo, getConnection } from "../util";
import { GatekeeperService } from "../service";
import {
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkKeyFlag,
} from "../util/oclif/flags";

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

    const gatewayToken: PublicKey = args.gatewayToken;
    const gatekeeper = flags.gatekeeperKey as Keypair;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;

    const connection = getConnection(flags.cluster);

    await airdropTo(connection, gatekeeperNetwork.publicKey);
    const service = new GatekeeperService(
      connection,
      gatekeeperNetwork,
      gatekeeperNetwork.publicKey,
      gatekeeper
    );

    this.log(`Revoking:
     ${gatewayToken.toBase58()}
     by gatekeeper ${gatekeeper.publicKey.toBase58()}`);

    const token = await service.revoke(gatewayToken);

    this.log("Revoked token", token.publicKey.toBase58());
  }
}
