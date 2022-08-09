import { Command, Flags } from "@oclif/core";
import { Keypair } from "@solana/web3.js";
// eslint-disable-next-line node/no-extraneous-import
import { readJSONSync } from "fs-extra";
import {
  i64,
  NetworkAuthKey,
  NetworkData,
  NetworkKeyFlags,
  NetworkKeyFlagsValues,
  u16,
  u8,
} from "../../../utils/state";
import { updateNetwork } from "../../../utils/update-network";
export default class Update extends Command {
  static description = "Updates a gatekeeper network";

  static examples = [
    `$ gateway network update --data ./network.json --key ./funder-key.json
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
    const { flags } = await this.parse(Update);
    const programId = Keypair.generate().publicKey;
    const network = Keypair.generate();
    const localSecretKey = readJSONSync(flags.key) as Uint8Array;
    this.log(`${localSecretKey}`);
    const funder = Keypair.fromSecretKey(localSecretKey);

    const networkData = new NetworkData(
      new u8(1),
      new i64(BigInt(60) * BigInt(60)),
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
    this.log(`Network Data: ${JSON.stringify(networkData)}`);
    const updatedNetwork = await updateNetwork(
      programId,
      network,
      funder,
      networkData
    );
    this.log("network created");
    this.log(`Block Height: ${updatedNetwork.lastValidBlockHeight}`);
  }
}
