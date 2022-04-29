import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  authorityKeypairFlag,
  gatekeeperPublicKeyFlag,
  clusterFlag,
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
    authorityKeypair: authorityKeypairFlag(),
    gatekeeperPublicKey: gatekeeperPublicKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "tokenID",
      required: true,
      description:
        "The public key of the owner for which to verify identity token",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GetToken);

    const pk = flags.authorityKeypair;
    const provider: BaseProvider = flags.cluster;
    const tokenID = args.tokenID as BigNumber;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const gatekeeperPublicKey: string = flags.gatekeeperPublicKey;

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);

    const token: TokenData = await gatewayToken.getToken(tokenID);

    this.log(
      `Gateway token information:

            Gateway TokenID: ${tokenID.toString()}
            Owner: ${token?.owner} 
            State: ${checkTokenState(token?.state)}
            Identity: ${token?.identity} 
            Expiration: ${token?.expiration.toString()} 
            Bitmask: ${token?.bitmask.toString()}
            on GatewayToken ${gatekeeperPublicKey} contract
			`
    );
  }
}
