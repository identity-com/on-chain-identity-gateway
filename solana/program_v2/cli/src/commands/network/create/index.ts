import { Command, Flags } from "@oclif/core";
import { Wallet } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
// import { GatewayService } from "../../../utils/GatewayService";
import GatewayService from "@identity.com/GatewayService";
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
    const localSecretKey = require(flags.key);
    const funder = Keypair.fromSecretKey(Buffer.from(localSecretKey));

    const [network] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("gk-network"),
        funder.publicKey.toBuffer(),
      ],
      new PublicKey("8sPUQcf96QpGyAuXM36Trf4FqsXBbM6wT9PKQjHLjysq")
    );

    const gatewayService = await GatewayService.build(
      network,
      undefined,
      new Wallet(funder),
      // undefined,
      undefined,
      new Connection("http://localhost:8899", "confirmed")
    );
    const createdNetworkSignature = await gatewayService
      .createNetwork(funder.publicKey)
      .rpc();
    // this.log(`--${createdNetworkSignature}`);
  }
}
