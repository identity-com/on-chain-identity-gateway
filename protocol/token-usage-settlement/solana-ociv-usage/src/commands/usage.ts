import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";

import { airdropTo, getConnection } from "../util";
import { UsageOracleService } from "../service/UsageOracleService";
import {
  clusterFlag,
  oracleKeyFlag,
} from "../util/oclif/flags"

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

    const dAppAddress: PublicKey = args.address;
    const oracleKey = flags.oracleKey as Keypair;
    this.log(`Reading Usage:
      oracle ${oracleKey.publicKey.toBase58()}
      dApp ${dAppAddress}`);

    const connection = getConnection(flags.cluster);

    await airdropTo(
      connection,
      oracleKey.publicKey,
      flags.cluster as string
    );

    const usageOracleService = new UsageOracleService(
      connection,
      oracleKey
    );

    const result = await usageOracleService.readUsage({
      dapp: dAppAddress,
      epoch: 256,
    });

    this.log(
      `Read Usage: ${result.length}`
    );
  }
}
