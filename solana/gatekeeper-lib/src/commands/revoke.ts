import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getConnection } from "../util/connection";
import { GatekeeperService } from "../service/GatekeeperService";
import { RecorderFS } from "../util/record";
import * as os from "os";
import * as fs from "fs";

export default class Revoke extends Command {
  static description = "Revoke a gateway token";

  static examples = [
    `$ ociv revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Revoked
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [
    {
      name: "gatewayToken",
      required: true,
      description: "The gateway token to revoke",
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
    const { args } = this.parse(Revoke);

    const gatewayToken: PublicKey = args.gatewayToken;
    this.log(`Revoking ${gatewayToken.toBase58()}`);

    const gatekeeperNetwork = new PublicKey(
      process.env.GATEKEEPER_NETWORK as string
    );
    this.log(`Using network ${gatekeeperNetwork.toBase58()}`);

    const gatekeeperAuthority: Keypair = args.gatekeeperAuthorityKeyFilepath;

    this.log(`Using authority ${gatekeeperAuthority.publicKey.toBase58()}`);
    const connection = await getConnection();
    const service = new GatekeeperService(
      connection,
      gatekeeperAuthority,
      gatekeeperNetwork,
      gatekeeperAuthority,
      new RecorderFS(),
      {
        defaultExpirySeconds: 15 * 60 * 60, // 15 minutes
      }
    );
    const token = await service.revoke(gatewayToken);

    this.log("Revoked token", token);
  }
}
