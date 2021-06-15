import { Command, flags } from "@oclif/command";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getConnection } from "../util/connection";
import * as fs from "fs";
import { GatekeeperNetworkService } from "../service/GatekeeperNetworkService";
import { PII, RecorderFS } from "../util/record";
import * as os from "os";
import bs58 = require("bs58");
import { airdropTo, MIN_AIRDROP_BALANCE } from "../util/account";

export const airdropSolIfRequired = async (
  connection: Connection,
  userPublicKey: PublicKey,
  minBalance = MIN_AIRDROP_BALANCE
): Promise<void> => {
  const balance = await connection.getBalance(userPublicKey);
  console.log("balance", {
    userPublicKey: userPublicKey.toBase58(),
    balance,
    minBalance,
  });
  if (balance < minBalance) {
    await airdropTo(
      connection,
      { publicKey: userPublicKey },
      minBalance - balance
    );
  }
};
export default class Issue extends Command {
  static description = "Issue a gateway token";

  static examples = [
    `$ ociv add-gatekeeper
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    name: flags.string({ char: "n" }),
    ip: flags.string({ char: "i" }),
  };

  static args = [
    {
      name: "gatekeeperAuthorityKeyFilepath",
      default: `${os.homedir()}/.config/solana/id.json`,
      required: false,
      description:
        "The private key file for the gatekeeper network authority, defaults to user .config/solana/id.json",
      parse: (input: string) =>
        Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(fs.readFileSync(input).toString("utf-8")))
        ),
    },
    {
      name: "gatekeeperNetworkKeyFilepath",
      default: `${os.homedir()}/.config/solana/id.json`,
      required: false,
      description:
        "The private key file for the gatekeeper network, defaults to user .config/solana/id.json",
      parse: (input: string) =>
        Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(fs.readFileSync(input).toString("utf-8")))
        ),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Issue);

    const gatekeeperAuthority: Keypair = args.gatekeeperAuthorityKeyFilepath;
    const gatekeeperNetwork: Keypair = args.gatekeeperNetworkKeyFilepath;

    const connection = await getConnection();
    await airdropSolIfRequired(connection, gatekeeperAuthority.publicKey);

    const networkService = new GatekeeperNetworkService(
      connection,
      gatekeeperAuthority, // as payer only
      gatekeeperNetwork
    );
    await networkService.addGatekeeper(gatekeeperAuthority.publicKey);
    console.log("Added gatekeeper to network");
    this.log(
      `Issuing from authority ${gatekeeperAuthority.publicKey.toBase58()}`
    );
    console.log(
      `Remember to run 'export GATEKEEPER_NETWORK=${gatekeeperNetwork.publicKey.toBase58()}`
    );
    console.log("Added gatekeeper", gatekeeperAuthority.publicKey.toBase58());
  }
}
