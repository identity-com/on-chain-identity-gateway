import { Command, Flags } from "@oclif/core";
import { utils} from "ethers";

import {makeGatewayTs} from "../utils/oclif/utils";
import {
  confirmationsFlag,
  gasPriceFeeFlag,
  gatewayTokenAddressFlag,
  networkFlag,
  privateKeyFlag
} from "../utils/oclif/flags";

export default class RemoveNetworkAuthority extends Command {
  static description = "Remove a network authority to a GatewayToken contract";

  static examples = [
    `$ gateway remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
      description:
        "Network authority address to remove from the GatewayToken contract",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> =>
        utils.isAddress(input) ? input : null,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveNetworkAuthority);

    const confirmations = flags.confirmations;

    const authority = args.address as string;
    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    this.log(`Removing:
			authority ${authority} 
			to GatewayToken ${gatewayTokenAddress}`);

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);
    const sendableTransaction = await gateway.removeNetworkAuthority(authority);

    this.log(`Transaction hash: ${sendableTransaction.hash}`);

    const receipt = await sendableTransaction.wait(confirmations);

    this.log(
      `Removeed network authority from Gateway Token contract. TxHash: ${receipt.transactionHash}`
    );
  }
}
