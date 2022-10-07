import { Command, Flags } from "@oclif/core";
import { Keypair, PublicKey } from "@solana/web3.js";

import { airdropTo } from "../util";
import { GatekeeperService } from "../service";
import {
  airdropFlag,
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/oclif/flags";
import { prettyPrint } from "../util/token";
import { getConnectionFromEnv } from "../util/oclif/utils";

export default class Issue extends Command {
  static description = "Issue a gateway token to a wallet";

  static examples = [
    `$ gateway issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    expiry: Flags.integer({
      char: "e",
      description:
        "The expiry time in seconds for the gateway token (default none)",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string) => Number(input),
    }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkPubkeyFlag(),
    cluster: clusterFlag(),
    airdrop: airdropFlag,
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address to issue the token to",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Issue);

    const address: PublicKey = args.address as PublicKey;
    const gatekeeper = flags.gatekeeperKey as Keypair;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as PublicKey;
    this.log(`Issuing:
      to ${address.toBase58()} 
      from gatekeeper ${gatekeeper.publicKey.toBase58()}
      in network ${gatekeeperNetwork.toBase58()}`);

    const connection = getConnectionFromEnv(flags.cluster);

    if (flags.airdrop) {
      await airdropTo(connection, gatekeeper.publicKey, flags.cluster as string);
    }

    const service = new GatekeeperService(
      connection,
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
    if (issuedToken) {
      this.log(prettyPrint(issuedToken));
    } else {
      this.log("No gateway token found after issuance.");
    }
  }
}
