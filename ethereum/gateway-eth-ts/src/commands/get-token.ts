import {
  gatewayTokenAddressFlag,
  networkFlag,
  tokenIdFlag
} from "../utils/oclif/flags";
import {Command, Flags} from "@oclif/core";
import {utils} from "ethers";
import {GatewayTs} from "../service/GatewayTs";
import {TokenState} from "../utils/types";

export default class GetToken extends Command {
  static description = "Get existing gateway token";

  static examples = [
    `$ gateway get 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];
  
  static aliases = ["verify"];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    tokenID: tokenIdFlag(),
    network: networkFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner ethereum address to get the token for",
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
    const { args, flags } = await this.parse(GetToken);

    const ownerAddress = args.address as string;

    const gatewayTokenAddress = flags.gatewayTokenAddress;

    this.log(`Getting token for ${ownerAddress}`);

    const network = await flags.network.getNetwork();

    const gateway = new GatewayTs(flags.network, network, gatewayTokenAddress);

    const token = await gateway.getToken(
      ownerAddress,
      flags.tokenID,
    );

    this.log('Token:', {
      owner: token.owner,
      state: TokenState[token.state],
      tokenId: token.tokenId.toString(),
      expiration: token.expiration.toString(),
      bitmask: token.bitmask.toString(),
    });
  }
}
