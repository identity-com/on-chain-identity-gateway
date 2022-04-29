import { Command, Flags } from "@oclif/core";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  authorityKeypairFlag,
  gatekeeperPublicKeyFlag,
  clusterFlag,
  gasPriceFeeFlag,
  confirmationsFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { BigNumber, utils, Wallet } from "ethers";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class UnfreezeToken extends Command {
  static description = "Unfreeze existing identity token using TokenID";

  static examples = [
    `$ gateway unfreeze 10
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    authorityKeypair: authorityKeypairFlag(),
    gatekeeperPublicKey: gatekeeperPublicKeyFlag(),
    cluster: clusterFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "tokenID",
      required: true,
      description: "The gateway token to unfreeze",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UnfreezeToken);

    const pk = flags.authorityKeypair;
    const provider: BaseProvider = flags.cluster;
    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const tokenID = args.tokenID as BigNumber;
    const gatekeeperPublicKey = flags.gatekeeperPublicKey;

    this.log(`Unfreezing existing token with TokenID:
			${tokenID.toString()} 
			on GatewayToken ${gatekeeperPublicKey} contract`);

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);

    const gasPrice = flags.gasPriceFee;
    const gasLimit = await gatewayToken.contract.estimateGas.unfreeze(tokenID);

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx = await gatewayToken.unfreeze(tokenID, txParams);
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash;
    }

    this.log(
      `Unfreezed existing token with TokenID: ${tokenID.toString()} TxHash: ${hash}`
    );
  }
}
