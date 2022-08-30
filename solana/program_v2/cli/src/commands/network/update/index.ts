import { Command, Flags } from "@oclif/core";
import { Wallet } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { GatewayService } from "../../../../../src/GatewayService";
import { airdrop } from "../../../../../src/lib/utils";
// import { readJSONSync } from "fs-extra";

// import { updateNetwork } from "../../../utils/update-network";
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
    program: Flags.string({
      char: "p",
      description: "The program id",
      hidden: false,
      multiple: false,
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    this.log("Update");
    const { flags } = await this.parse(Update);
    const programId = flags.program
      ? flags.program
      : Keypair.generate().publicKey;
    const localSecretKey = require(flags.key);
    const funder = localSecretKey
      ? Keypair.fromSecretKey(Buffer.from(localSecretKey))
      : Keypair.generate();
    const data = flags.data ? flags.data : {};

    const [network] = await GatewayService.createNetworkAddress(
      funder.publicKey
    );
    this.log(`${network}`);
    const gatewayService = await GatewayService.build(
      network,
      new Wallet(funder),
      // TODO: mainnet is default
      "localnet"
    );
    // TODO: Remove airdrop
    this.log("before airdrop");
    await airdrop(
      gatewayService.getConnection(),
      funder.publicKey,
      LAMPORTS_PER_SOL
    );
    this.log("after airdrop");

    const createdNetworkSignature = await gatewayService
      .updateNetwork(funder.publicKey, data)
      .rpc();
    this.log(`--${createdNetworkSignature}`);
  }
}
