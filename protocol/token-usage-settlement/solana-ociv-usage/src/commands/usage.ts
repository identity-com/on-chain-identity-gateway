import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";

import { airdropTo, getConnection } from "../util";
import { UsageOracleService } from "../service/UsageOracleService";
import {
  clusterFlag,
  oracleKeyFlag,
} from "../util/oclif/flags"
import { ExtendedCluster } from "../util/connection";

export default class AddGatekeeper extends Command {
  static description = "Read usage based on a strategy.";

  static examples = [
    `$ gateway-usage <Strategy>
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    oracleKey: oracleKeyFlag(),
    cluster: clusterFlag(),
    epoch: flags.integer({
      char: "e",
      description: "The epoch or period that the usage refers to",
      required: true,
    }),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(AddGatekeeper);

    const lookupProgram: PublicKey = args.address;
    const oracleKey = flags.oracleKey as Keypair;
    this.log(`Reading Usage:
      oracle ${oracleKey.publicKey.toBase58()}
      program ${lookupProgram}`);

    const epoch = flags.epoch as number;

    const connection = getConnection(flags.cluster as ExtendedCluster);

    // await airdropTo(
    //   connection,
    //   oracleKey.publicKey,
    //   flags.cluster as string
    // );

    const usageOracleService = new UsageOracleService(
      connection,
      oracleKey
    );

    const result = await usageOracleService.readUsage({
      program: lookupProgram,
      epoch,
    });

    this.log(
      `Read Usage: ${result.length}`
    );

    this.log(
      JSON.stringify(result.map(x => x.signature))
    )
  }
}
