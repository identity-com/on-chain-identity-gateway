import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
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
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class BurnToken extends Command {
  static description = "Burn existing identity token using TokenID";

  static examples = [
    `$ gateway burn 10
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
      description: "Token ID number to burn",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BurnToken);

    const tokenID = args.tokenID as BigNumber;
    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;
    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);
    const owner = await gatewayToken.getTokenOwner(tokenID);

    this.log(`Burning existing token with TokenID:
			${tokenID.toString()} 
			for owner ${owner}
			on GatewayToken ${gatewayTokenAddress} contract`);

    const gasPrice = flags.gasPriceFee;
    const gasLimit = await gatewayToken.contract.estimateGas.burn(tokenID);

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx = await gatewayToken.burn(tokenID, txParams);
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash
    }

    this.log(
      `Burned existing token with TokenID: ${tokenID.toString()} TxHash: ${hash}`
    );
  }
}
