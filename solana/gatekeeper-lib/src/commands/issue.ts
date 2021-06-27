import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";

import { getConnection } from "../util";
import * as fs from "fs";
import { GatekeeperService } from "../service";
import * as os from "os";

export default class Issue extends Command {
  static description = "Issue a gateway token";

  static examples = [
    `$ ociv issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    name: flags.string({ char: "n" }),
    ip: flags.string({ char: "i" }),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address to issue the token to",
      parse: (input: string) => new PublicKey(input),
    },
    {
      name: "gatekeeperAuthorityKeyFilepath",
      default: `${os.homedir()}/.config/solana/id.json`,
      required: false,
      description: "The private key file for the gatekeeper network authority",
      parse: (input: string) =>
        Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(fs.readFileSync(input).toString("utf-8")))
        ),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Issue);

    const address: PublicKey = args.address;
    this.log(`Issuing to ${address.toBase58()}`);

    const gatekeeperNetwork = new PublicKey(
      process.env.GATEKEEPER_NETWORK as string
    );
    this.log(`Issuing from network ${gatekeeperNetwork.toBase58()}`);

    const gatekeeperAuthority: Keypair = args.gatekeeperAuthorityKeyFilepath;

    this.log(
      `Issuing from authority ${gatekeeperAuthority.publicKey.toBase58()}`
    );

    const connection = await getConnection();
    const service = new GatekeeperService(
      connection,
      gatekeeperAuthority,
      gatekeeperNetwork,
      gatekeeperAuthority,
      {
        defaultExpirySeconds: 15 * 60 * 60, // 15 minutes
      }
    );

    const token = await service.issue(address);

    console.log(token);
  }
}
