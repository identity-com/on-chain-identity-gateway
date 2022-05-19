import { Command, Flags } from "@oclif/core";
import { utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  privateKeyFlag,
  gatewayTokenAddressFlag,
  networkFlag,
} from "../utils/flags";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class GetTokenID extends Command {
  static description = "Get default gateway token ID by owner's address";

  static examples = [
    `$ gateway get-token-id 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    network: networkFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner address to verify identity token for",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      }
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GetTokenID);

    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const ownerAddress = args.address as string;
    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

    const tokenId = await gatewayToken.getTokenId(
      ownerAddress
    );

    this.log(
      `Default gateway token ID  for owner address: ${ownerAddress} 
            is ${tokenId.toString()} on GatewayToken ${gatewayTokenAddress} contract
			`
    );
  }
}
