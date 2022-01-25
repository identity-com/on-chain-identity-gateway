import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";

import { airdropTo, getConnection } from "../util";
import { GatekeeperService } from "../service";
import {
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/oclif/flags";
import { prettyPrint } from "../util/token";

export default class Issue extends Command {
  static description = "Issue a gateway token to a wallet";

  static examples = [
    `$ gateway issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    expiry: flags.integer({
      char: "e",
      description:
        "The expiry time in seconds for the gateway token (default none)",
      parse: (input: string) => Number(input),
    }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkPubkeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address to issue the token to",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Issue);

    const address: PublicKey = args.address;
    const gatekeeper = flags.gatekeeperKey as Keypair;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as PublicKey;
    this.log(`Issuing:
      to ${address.toBase58()} 
      from gatekeeper ${gatekeeper.publicKey.toBase58()}
      in network ${gatekeeperNetwork.toBase58()}`);

    const connection = getConnection(flags.cluster);

    await airdropTo(connection, gatekeeper.publicKey, flags.cluster as string);

    const service = new GatekeeperService(
      connection,
      gatekeeper,
      gatekeeperNetwork,
      gatekeeper,
      flags.expiry
        ? {
            defaultExpirySeconds: flags.expiry,
          }
        : {}
    );

    const gatekeeperAccountExists = await service.isRegistered();
    if (!gatekeeperAccountExists) {
      this.log(
        `Gatekeeper ${gatekeeper.publicKey.toBase58()} not present in network ${gatekeeperNetwork.toBase58()}. Use "gateway add-gatekeeper" to add it.`
      );
    }

    const issuedToken = await service
      .issue(address)
      .then((t) => t.send())
      .then((t) => t.confirm());

    this.log(prettyPrint(issuedToken));
  }
}
