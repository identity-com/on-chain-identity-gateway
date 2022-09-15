import { Command, Flags } from "@oclif/core";
import { Wallet } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
// TODO: Import Gateway Service properly with package.json
import { GatewayService } from "@identity.com/solana-gateway-ts-v2/src/GatewayService";
import { airdrop } from "@identity.com/solana-gateway-ts-v2/src/lib/utils";
export default class Create extends Command {
  static description = "Creates a gatekeeper network";

  static examples = [
    `$ gateway network create --data ./network.json --key ./funder-key.json --cluster localnet
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
      required: true,
    }),
    cluster: Flags.string({
      char: "c",
      description: "The cluster you wish to use",
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const programId = Keypair.generate().publicKey;
    // eslint-disable-next-line unicorn/prefer-module
    const localSecretKey = require(flags.key);
    const funder = localSecretKey
      ? Keypair.fromSecretKey(Buffer.from(localSecretKey))
      : Keypair.generate();

    const [network] = await GatewayService.createNetworkAddress(programId);
    this.log(`${network}`);
    const gatewayService = await GatewayService.build(
      network,
      new Wallet(funder),
      // TODO: mainnet is default
      flags.cluster ? flags.cluster : "localnet"
    );
    // TODO: Remove airdrop
    this.log("before airdrop");
    await airdrop(
      gatewayService.getConnection(),
      funder.publicKey,
      LAMPORTS_PER_SOL
    );
    this.log("after airdrop");

    const createdNetworkSignature = await gatewayService.createNetwork().rpc();
    this.log(`--${createdNetworkSignature}`);
  }
}
