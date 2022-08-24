import { Command, Flags } from "@oclif/core";
import { Wallet } from "@project-serum/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { GatewayService } from "../../../utils/GatewayService";

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

    const gatewayService = await GatewayService.build(
      network.publicKey,
      undefined,
      new Wallet(funder),
      undefined,
      new Connection("http://localhost:8899", "confirmed")
    );
    const createdNetworkSignature = await gatewayService
      .createNetwork(funder.publicKey)
      .rpc();
    this.log(`${createdNetworkSignature}`);
  }
}
