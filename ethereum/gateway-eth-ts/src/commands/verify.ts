import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  authorityKeypairFlag,
  gatekeeperNetworkPublicKeyFlag,
  clusterFlag,
} from "../utils/flags";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class VerifyToken extends Command {
  static description = "Verify existing identity using token owner address";

  static examples = [
    `$ gateway verify 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperKeypair: authorityKeypairFlag(),
    gatekeeperNetworkPublicKey: gatekeeperNetworkPublicKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description:
        "The public key of the user for which to identify token ownership",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      },
    },

    {
      name: "tokenId",
      required: false,
      description: "Token ID to verify identity for",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VerifyToken);

    const pk = flags.gatekeeperKeypair;
    const provider: BaseProvider = flags.cluster;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const ownerAddress = args.address as string;
    const gatekeeperPublicKey: string = flags.gatekeeperNetworkPublicKey;
    const tokenId = args.tokenId as BigNumber;

    this.log(`Verifying existing identity token using owner address:
			${ownerAddress} 
			on GatewayToken ${gatekeeperPublicKey} contract`);

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);

    const tx = (await (tokenId
      ? gatewayToken.verifyTokenByTokenID(ownerAddress, tokenId)
      : gatewayToken.verifyToken(ownerAddress))) as unknown as boolean[]; // TODO: fix type

    this.log(
      tx[0]
        ? `Verified existing token for owner address: ${ownerAddress}
			`
        : `Unable to verify identity token for owner address: ${ownerAddress}
			`
    );
  }
}
