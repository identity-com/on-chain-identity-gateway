import { Command, flags } from "@oclif/command";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  privateKeyFlag,
  gatewayTokenAddressFlag,
  networkFlag,
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
    help: flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    network: networkFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "tokenID",
      required: true,
      description: "Token ID number to unfreeze",
      parse: (input: string): BigNumber => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(UnfreezeToken);

    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;
    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const tokenID: BigNumber = args.tokenID;
    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    this.log(`Unfreezing existing token with TokenID:
			${tokenID.toString()} 
			on GatewayToken ${gatewayTokenAddress} contract`);

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

    const gasPrice = await flags.gasPriceFee;
    const gasLimit = await gatewayToken.contract.estimateGas.unfreeze(tokenID);

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx: any = await (confirmations > 0
      ? (await gatewayToken.unfreeze(tokenID, txParams)).wait(confirmations)
      : gatewayToken.unfreeze(tokenID, txParams));

    this.log(
      `Unfreezed existing token with TokenID: ${tokenID.toString()} TxHash: ${
        confirmations > 0 ? tx.transactionHash : tx.hash
      }`
    );
  }
}
