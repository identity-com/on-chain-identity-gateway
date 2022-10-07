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

export default class AddNetworkAuthority extends Command {
  static description = "Add a network authority to a GatewayToken contract";

  static examples = [
    `$ gateway add-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
        "Network authority address to add to the GatewayToken contract",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> =>
        utils.isAddress(input) ? input : null,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddNetworkAuthority);

    const confirmations = flags.confirmations;

    const authority = args.address as string;
    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    this.log(`Adding:
			authority ${authority} 
			to GatewayToken ${gatewayTokenAddress}`);

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);
    const sendableTransaction = await gateway.addNetworkAuthority(authority);

    const receipt = await sendableTransaction.wait(confirmations);

    this.log(
      `Added network authority to Gateway Token contract. TxHash: ${receipt.transactionHash}`
    );
  }
}
