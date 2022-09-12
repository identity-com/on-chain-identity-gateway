import { Command, Flags } from "@oclif/core";
import { utils} from "ethers";
import { getExpirationTime } from "../utils/time";
import {
  confirmationsFlag,
  gasPriceFeeFlag,
  gatewayTokenAddressFlag,
  networkFlag,
  privateKeyFlag, tokenIdFlag
} from "../utils/oclif/flags";
import {makeGatewayTs} from "../utils/oclif/utils";

export default class RefreshToken extends Command {
  static description =
    "Refresh existing gateway token for Ethereum address";

  static examples = [
    `$ gateway refresh 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 60
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    network: networkFlag(),
    tokenID: tokenIdFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner ethereum address to refresh the token for",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      },
    },
    {
      name: "expiry",
      required: false,
      description:
        "The new expiry time in seconds for the gateway token (default 14 days)",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<number> => Number(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RefreshToken);

    const confirmations = flags.confirmations;
    const tokenID = flags.tokenID;
    const now = Math.floor(Date.now() / 1000);
    const expiry = args.expiry as number;
    const ownerAddress = args.address as string;

    const expiration = getExpirationTime(expiry);
    const days = Math.floor(expiration.sub(now).div(86_400).toNumber());

    const gatewayTokenAddress = flags.gatewayTokenAddress;

    this.log(`Refreshing existing token with TokenID:
			${tokenID.toString()} 
			for ${days} days
			on GatewayToken ${gatewayTokenAddress} contract`);

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);

    const sendableTransaction = await gateway.refresh(
      ownerAddress,
      flags.tokenID,
      expiration,
    );

    this.log(`Transaction hash: ${sendableTransaction.hash}`);

    const receipt = await sendableTransaction.wait(confirmations);

    this.log(`Token refreshed. TxHash: ${receipt.transactionHash}`);
  }
}
