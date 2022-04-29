import { Command, Flags } from "@oclif/core";
import { utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  authorityKeypairFlag,
  gatekeeperPublicKeyFlag,
  clusterFlag,
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
    authorityKeypair: authorityKeypairFlag(),
    gatekeeperPublicKey: gatekeeperPublicKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description:
        "The public key of the owner for which to verify identity token",
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
    const { args, flags } = await this.parse(GetTokenID);

    const pk = flags.authorityKeypair;
    const provider: BaseProvider = flags.cluster;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const ownerAddress = args.address as string;
    const gatekeeperPublicKey: string = flags.gatekeeperPublicKey;

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);

    const tokenId = await gatewayToken.getTokenId(ownerAddress);

    this.log(
      `Default gateway token ID  for owner address: ${ownerAddress} 
            is ${tokenId.toString()} on GatewayToken ${gatekeeperPublicKey} contract
			`
    );
  }
}
