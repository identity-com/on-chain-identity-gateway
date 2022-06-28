import { Command, Flags } from "@oclif/core";
import { BigNumber, utils} from "ethers";
import { getExpirationTime } from "../utils/time";
import {
  bitmaskFlag, confirmationsFlag,
  gasPriceFeeFlag, gatewayTokenAddressFlag,
  networkFlag,
  privateKeyFlag,
  tokenIdFlag
} from "../utils/oclif/flags";
import {makeGatewayTs} from "../utils/oclif/utils";
import {ZERO_BN} from "../utils/constants";

export default class IssueToken extends Command {
  static description =
    "Issue new gateway token with TokenID for Ethereum address";

  static examples = [
    `$ gateway issue 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    network: networkFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
    bitmask: bitmaskFlag(),
    tokenID: tokenIdFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner ethereum address to issue the token to",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      },
    },
    {
      name: "expiration",
      required: false,
      description: "Expiration timestamp for newly issued token",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: any): Promise<BigNumber> => BigNumber.from(input),
      default: ZERO_BN,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(IssueToken);

    const confirmations = flags.confirmations;
    const bitmask: BigNumber = flags.bitmask;
    const ownerAddress = args.address as string;
    let expiration = args.expiration as BigNumber;
    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    if (expiration.gt(0)) {
      expiration = getExpirationTime(expiration);
    }

    const gateway = await makeGatewayTs(flags.network, flags.privateKey, gatewayTokenAddress, flags.gasPriceFee);
    const sendableTransaction = await gateway.issue(
      ownerAddress,
      flags.tokenID,
      expiration,
      bitmask,
    );

    this.log(`Issuing new token for owner ${ownerAddress}
			on GatewayToken ${gatewayTokenAddress} contract.`);

    this.log(`Transaction hash: ${sendableTransaction.hash}`);

    const receipt = await sendableTransaction.wait(confirmations);
    
    this.log(`Token issued. TxHash: ${receipt.transactionHash}`);
  }
}
