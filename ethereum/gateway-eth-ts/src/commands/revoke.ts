import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import { GatewayToken } from "../contracts/GatewayToken";
import {
  authorityKeypairFlag,
  gatekeeperNetworkPublicKeyFlag,
  clusterFlag,
  gasPriceFeeFlag,
  confirmationsFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class RevokeToken extends Command {
  static description = "Revoke existing identity token by TokenID";

  static examples = [
    `$ gateway revoke 10
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperKeypair: authorityKeypairFlag(),
    gatekeeperNetworkPublicKey: gatekeeperNetworkPublicKeyFlag(),
    cluster: clusterFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "tokenID",
      required: true,
      description: "The gateway token to revoke",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RevokeToken);

    const tokenID = args.tokenID as BigNumber;
    const pk = flags.gatekeeperKeypair;
    const provider: BaseProvider = flags.cluster;
    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const gatekeeperPublicKey: string = flags.gatekeeperNetworkPublicKey;

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);
    const owner = await gatewayToken.getTokenOwner(tokenID);

    this.log(`Revoking existing token with TokenID:
			${tokenID.toString()} 
			for owner ${owner}
			on GatewayToken ${gatekeeperPublicKey} contract`);

    const gasPrice = flags.gasPriceFee;
    const gasLimit = await gatewayToken.contract.estimateGas.revoke(tokenID);

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx = await gatewayToken.revoke(tokenID, txParams);
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash;
    }

    this.log(
      `Revoked existing token with TokenID: ${tokenID.toString()} TxHash: ${hash}`
    );
  }
}
