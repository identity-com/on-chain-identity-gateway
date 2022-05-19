import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  privateKeyFlag,
  gatewayTokenAddressFlag,
  networkFlag,
} from "../utils/flags";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";
import { TokenData } from "../utils/types";
import { checkTokenState } from "../utils/token-state";

export default class GetToken extends Command {
  static description = "Get information related to gateway token by tokenID";

  static examples = [
    `$ gateway get-token 10
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
      name: "tokenID",
      required: true,
      description: "Owner address to verify identity token for",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GetToken);

    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;
    const tokenID = args.tokenID as BigNumber;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

    const token: TokenData = await gatewayToken.getToken(tokenID);

    this.log(
      `Gateway token information:

            Gateway TokenID: ${tokenID.toString()}
            Owner: ${token?.owner} 
            State: ${checkTokenState(token?.state)}
            Identity: ${token?.identity} 
            Expiration: ${token?.expiration.toString()} 
            Bitmask: ${token?.bitmask.toString()}
            on GatewayToken ${gatewayTokenAddress} contract
			`
    );
  }
}
