import { Command, Flags } from "@oclif/core";
import { Wallet } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import { GatewayService } from "../../../GatewayService";
import { FeeStructure } from "../../../lib/types";
import { airdrop } from "../../../lib/utils";
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
      : "FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe";
    const localSecretKey = flags.key ? require(flags.key) : null;
    const funder = localSecretKey
      ? Keypair.fromSecretKey(Buffer.from(localSecretKey))
      : Keypair.generate();
    const suppliedDataFile = readFileSync(flags.data).toString();
    const updateData = suppliedDataFile
      ? JSON.parse(suppliedDataFile)
      : {
          authThreshold: 1,
          passExpireTime: 600,
          fees: {
            add: [
              {
                token: Keypair.generate().publicKey,
                issue: 1,
                refresh: 2,
                expire: 3,
                verify: 4,
              },
            ],
            remove: [],
          },
          authKeys: {
            add: [],
            remove: [],
          },
        };

    const [network] = await GatewayService.createNetworkAddress(
      funder.publicKey
    );
    const gatewayService = await GatewayService.build(
      network,
      new Wallet(funder),
      // TODO: mainnet is default
      "localnet"
    );
    // TODO: Remove airdrop
    await airdrop(
      gatewayService.getConnection(),
      funder.publicKey,
      LAMPORTS_PER_SOL
    );
    updateData.fees = updateData.fees.map((fee: FeeStructure) => {
      fee.token = new PublicKey(fee.token);
    });

    const createdNetworkSignature = await gatewayService
      .updateNetwork(updateData)
      .rpc();
    this.log(`--${createdNetworkSignature}`);
  }
}
