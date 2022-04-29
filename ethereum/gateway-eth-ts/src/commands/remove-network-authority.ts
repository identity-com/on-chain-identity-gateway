import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import { GatewayToken } from "../contracts/GatewayToken";
import {
  authorityKeypairFlag,
  gatekeeperPublicKeyFlag,
  clusterFlag,
  gasPriceFeeFlag,
  confirmationsFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class RemoveNetworkAuthority extends Command {
  static description = "Remove network authority to a GatewayToken contract";

  static examples = [
    `$ gateway remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
      name: "address",
      required: true,
      description:
        // ? Unclear to me what this means... Would like to change it but not sure how to describe
        "Network authority address to remove to the GatewayToken contract",
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
    const { args, flags } = await this.parse(RemoveNetworkAuthority);

    const pk = flags.authorityKeypair;
    const provider: BaseProvider = flags.cluster;
    let signer: Wallet;
    const confirmations = flags.confirmations;

    signer = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const authority = args.address as string;

    signer = signer.connect(provider);

    const gatekeeperPublicKey: string = flags.gatekeeperPublicKey;

    this.log(`Removing:
			network authority ${authority} 
			to GatewayToken ${gatekeeperPublicKey}`);

    const gatewayToken = new GatewayToken(signer, gatekeeperPublicKey);

    const gasPrice = flags.gasPriceFee;
    const gasLimit =
      await gatewayToken.contract.estimateGas.removeNetworkAuthority(authority);

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx = await gatewayToken.removeNetworkAuthority(authority, txParams);
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash;
    }

    this.log(
      `Removed network authority on Gateway Token contract. TxHash: ${hash}`
    );
  }
}
