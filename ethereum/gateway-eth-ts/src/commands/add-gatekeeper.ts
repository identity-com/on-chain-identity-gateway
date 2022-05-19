import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import { GatewayToken } from "../contracts/GatewayToken";
import {
  authorityKeypairFlag,
  gatekeeperNetworkPublicKeyFlag,
  clusterFlag,
  confirmationsFlag,
  gasPriceFeeFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class AddGatekeeper extends Command {
  static description = "Add a gatekeeper to a GatewayToken contract";

  static examples = [
    `$ gateway add-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    authorityKeypair: authorityKeypairFlag(),
    gatekeeperNetworkPublicKey: gatekeeperNetworkPublicKeyFlag(),
    cluster: clusterFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The public key of the gatekeeper to add to the network",
      // ? Should this be changed to Promise<PublicKey> similarly to in gatekeeper-lib?
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string | null> =>
        utils.isAddress(input) ? input : null,
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddGatekeeper);

    const pk = flags.authorityKeypair;
    const gatekeeper: string = args.address as string;
    const provider: BaseProvider = flags.cluster;

    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const gatekeeperPublicKey: string = flags.gatekeeperNetworkPublicKey;

    this.log(`Adding:
			gatekeeper ${gatekeeper} 
			to GatewayToken ${gatekeeperPublicKey}`);

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);

    const gasPrice = flags.gasPriceFee;
    const gasLimit: BigNumber =
      await gatewayToken.contract.estimateGas.addGatekeeper(gatekeeper);

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx = await gatewayToken.addGatekeeper(gatekeeper, txParams);
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash;
    }

    this.log(`Added gatekeeper to Gateway Token contract. TxHash: ${hash}`);
  }
}
