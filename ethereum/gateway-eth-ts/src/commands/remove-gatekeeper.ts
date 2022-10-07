import {
  confirmationsFlag,
  gasPriceFeeFlag,
  gatewayTokenAddressFlag,
  networkFlag,
  privateKeyFlag
} from "../utils/oclif/flags";
import {Command, Flags} from "@oclif/core";
import {makeGatewayTs} from "../utils/oclif/utils";
import {utils} from "ethers";

export default class RemoveGatekeeper extends Command {
  static description = "Remove a gatekeeper from a GatewayToken contract";

  static examples = [
    `$ gateway remove-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    network: networkFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Gatekeeper address to remove to the GatewayToken contract",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string | null> =>
        utils.isAddress(input) ? input : null,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveGatekeeper);

    const gatekeeper: string = args.address as string;

    const confirmations = flags.confirmations;

    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    this.log(`Removing:
			gatekeeper ${gatekeeper} 
			to GatewayToken ${gatewayTokenAddress}`);

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);
    const sendableTransaction = await gateway.removeGatekeeper(gatekeeper);

    this.log(`Transaction hash: ${sendableTransaction.hash}`);

    const receipt = await sendableTransaction.wait(confirmations);

    this.log(
      `Removed gatekeeper from Gateway Token contract. TxHash: ${receipt.transactionHash}`
    );
  }
}
