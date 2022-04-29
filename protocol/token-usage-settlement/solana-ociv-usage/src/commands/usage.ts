import * as commonFlags from "../lib/flags";
import { Flags } from "@oclif/core";

import { getConnection } from "../util";
import { UsageOracleService } from "../service";
import { clusterFlag, oracleKeyFlag } from "../util/oclif/flags";
import { ExtendedCluster } from "../util/connection";
import Base from "./base";
import { UsageConfig } from "../service/config";
import { printCSV } from "../service/CsvWriter";
import { getUploader } from "../service/upload";

export default class SolanaUsage extends Base {
  static description = "Read usage based on a configuration.";

  static examples = [`$ solana-usage <Strategy>`];

  static flags = {
    ...commonFlags.common,
    oracleKey: oracleKeyFlag(),
    cluster: clusterFlag(),
    epoch: Flags.integer({
      char: "e",
      description: "The epoch or period that the usage refers to",
      required: true,
    }),
    upload: Flags.string({
      char: "u",
      required: false,
      description: "The method to use for uploading the file",
    }),
    bucket: Flags.string({
      char: "b",
      required: false,
      description: "The name of the bucket to upload to",
    }),
    folder: Flags.string({
      char: "f",
      required: false,
      description: "The name of the folder to upload to",
    }),
  };

  static args = [
    {
      name: "name",
      required: true,
      description: "Name of the Program config to use",
      // parse: async (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = await this.parse(SolanaUsage);

    this.usageConfig.config.configs.forEach((config) => {
      // print all
      this.log(config.name);
      this.log(`${config.mask[0]}, ${config.mask[1]}`);
      this.log(config.program.toBase58());
      this.log(
        `instructions: ${JSON.stringify(config.instructions["000a0000"])}`
      );
    });

    let matchedConfig: UsageConfig | undefined;
    this.usageConfig.config.configs.forEach((config) => {
      if (config.name === args.name) {
        matchedConfig = config;
      }
    });

    if (!matchedConfig) {
      throw new Error(`No config found for ${args.name}`);
    }

    const uploader = getUploader(flags.upload);

    const previousSlot = await uploader.getLastSlot(
      flags,
      matchedConfig.program,
      matchedConfig.network
    );

    console.log(`Found previous slot ${previousSlot ?? "<none>"}`);

    // const lookupProgram: PublicKey = args.address;
    // const oracleKey = flags.oracleKey as Keypair;
    // this.log(`Reading Usage:
    //   oracle ${oracleKey.publicKey.toBase58()}
    //   program ${lookupProgram}`);
    //
    const epoch = flags.epoch as number;
    //
    const connection = getConnection(flags.cluster as ExtendedCluster);
    //
    // // await airdropTo(
    // //   connection,
    // //   oracleKey.publicKey,
    // //   flags.cluster as string
    // // );
    //
    const usageOracleService = new UsageOracleService(
      connection,
      matchedConfig
    );

    const { billableTx, firstSlot, lastSlot } =
      await usageOracleService.readUsage({
        epoch,
        previousSlot,
      });

    const filename = `${matchedConfig.program.toBase58()}_${matchedConfig.network.toBase58()}_${firstSlot}_${lastSlot}.csv.gz`;

    const output = uploader.createUploadStream(flags, filename);

    printCSV(output, billableTx);

    output.end();

    // this.log(`Read Usage: ${result.length}`);

    // this.log(JSON.stringify(result.map((x) => x.signature)));
  }
}
