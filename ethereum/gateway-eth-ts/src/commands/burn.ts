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

export default class BurnToken extends Command {
  static description = "Burn existing identity token";

  static examples = [
    `$ gateway burn 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
      description: "Owner ethereum address to burn the token for",
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
    const { args, flags } = await this.parse(BurnToken);

    const confirmations = flags.confirmations;
    const ownerAddress = args.address as string;

    const gatewayTokenAddress = flags.gatewayTokenAddress;

    this.log(`Burning token for ${ownerAddress}`);

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);

    const sendableTransaction = await gateway.burn(
      ownerAddress,
      flags.tokenID,
    );

    const receipt = await sendableTransaction.wait(confirmations);

    this.log(`Token burnd. TxHash: ${receipt.transactionHash}`);
  }
}
