import { Command, Flags } from "@oclif/core";
import { Keypair } from "@solana/web3.js";
// import { readJSONSync } from "fs-extra";
// import { readFile, readFileSync } from "node:fs";
import { createNetwork } from "../../../utils/create-network";
import {
  i64,
  NetworkAuthKey,
  NetworkData,
  NetworkKeyFlags,
  NetworkKeyFlagsValues,
  u16,
  u8,
} from "../../../utils/state";
export default class Create extends Command {
  static description = "Creates a gatekeeper network";

  static examples = [
    `$ gateway network create --data ./network.json --key ./funder-key.json
Latest Blockhash: [blockhash]
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    data: Flags.string({
      char: "d",
      description: "Path to network data",
      required: false,
    }),
    key: Flags.string({
      char: "k",
      description: "Path to a solana keypair",
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const programId = Keypair.generate().publicKey;
    const network = Keypair.generate();
    const localSecretKey = require(flags.key);
    const funder = Keypair.fromSecretKey(Buffer.from(localSecretKey));
    const networkData = new NetworkData(
      new u8(1),
      new i64(BigInt(3600)),
      new u16(0),
      new u8(0),
      [],
      [
        new NetworkAuthKey(
          NetworkKeyFlags.fromFlagsArray([NetworkKeyFlagsValues.AUTH]),
          funder.publicKey
        ),
      ]
    );
    this.log(`Program ID: ${programId.toString()}`);
    this.log(`Network ID: ${network.publicKey.toString()}`);
    this.log(`Funder ID: ${funder.publicKey.toString()}`);
    this.log(`Network Data: ${networkData.authKeys[0].serializedSize()}`);
    const createdNetwork = await createNetwork(
      programId,
      network,
      funder,
      networkData
    );
    this.log("network created");
    this.log(`Block Height: ${createdNetwork.signature}`);
  }
}
