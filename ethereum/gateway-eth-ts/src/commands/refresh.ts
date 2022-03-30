import { Command, Flags } from "@oclif/core";
import { BaseProvider } from "@ethersproject/providers";
import { GatewayToken } from "../contracts/GatewayToken";
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
import { getExpirationTime } from "../utils/time";

export default class RefreshToken extends Command {
  static description =
    "Refresh existing identity token with TokenID for Ethereum address";

  static examples = [
    `$ gateway refresh 10 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
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
      description: "Token ID number to refresh",
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
    {
      name: "expiry",
      required: false,
      description:
        "The new expiry time in seconds for the gateway token (default 14 days)",
      parse: async (input: string): Promise<number> => Number(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RefreshToken);

    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;
    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const tokenID: BigNumber = args.tokenID;
    const now = Math.floor(Date.now() / 1000);
    const expiry: number = args.expiry;

    const expirationDate = getExpirationTime(expiry);
    const days = Math.floor(expirationDate.sub(now).div(86_400).toNumber());

    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    this.log(`Refreshing existing token with TokenID:
			${tokenID.toString()} 
			for ${days} days
			on GatewayToken ${gatewayTokenAddress} contract`);

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

    const gasPrice = await flags.gasPriceFee;
    const gasLimit = await gatewayToken.contract.estimateGas.setExpiration(
      tokenID,
      expirationDate
    );

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx: any = await (confirmations > 0
      ? (
          await gatewayToken.setExpiration(tokenID, expirationDate, txParams)
        ).wait(confirmations)
      : gatewayToken.setExpiration(tokenID, expirationDate, txParams));

    this.log(
      `Refreshed token with: ${tokenID.toString()} tokenID for ${days} days. TxHash: ${
        confirmations > 0 ? tx.transactionHash : tx.hash
      }`
    );
  }
}
