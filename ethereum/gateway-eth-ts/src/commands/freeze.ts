import {
  confirmationsFlag,
  gasPriceFeeFlag,
  gatewayTokenAddressFlag,
  networkFlag,
  privateKeyFlag, tokenIdFlag
} from "../utils/oclif/flags";
import {Command, Flags} from "@oclif/core";
import {makeGatewayTs} from "../utils/oclif/utils";
import {utils} from "ethers";

export default class FreezeToken extends Command {
  static description = "Freeze existing gateway token";

  static examples = [
    `$ gateway freeze 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    tokenID: tokenIdFlag(),
    network: networkFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner ethereum address to freeze the token for",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      },
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FreezeToken);

    const confirmations = flags.confirmations;
    const ownerAddress = args.address as string;

    const gatewayTokenAddress = flags.gatewayTokenAddress;

    this.log(`Freezing token for ${ownerAddress}`);

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);

    const sendableTransaction = await gateway.freeze(
      ownerAddress,
      flags.tokenID,
    );

    this.log(`Transaction hash: ${sendableTransaction.hash}`);

    const receipt = await sendableTransaction.wait(confirmations);

    this.log(`Token frozen. TxHash: ${receipt.transactionHash}`);
  }
}
