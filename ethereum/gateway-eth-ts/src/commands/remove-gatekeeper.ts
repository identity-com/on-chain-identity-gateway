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

export default class RemoveGatekeeper extends Command {
  static description = "Remove gatekeeper to a GatewayToken contract";

  static examples = [
    `$ gateway remove-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
      name: "address",
      required: true,
      description: "Gatekeeper address to remove to the GatewayToken contract",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      }
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveGatekeeper);

    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;
    let signer: Wallet;
    const confirmations = flags.confirmations;

    signer = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    const gatekeeper = args.address as string;

    signer = signer.connect(provider);

    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    this.log(`Removing:
			gatekeeper ${gatekeeper} 
			to GatewayToken ${gatewayTokenAddress}`);

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

    const gasPrice = flags.gasPriceFee;
    const gasLimit = await gatewayToken.contract.estimateGas.removeGatekeeper(
      gatekeeper
    );

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    const tx = await gatewayToken.removeGatekeeper(gatekeeper, txParams)
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash
    }

    this.log(
      `Removed gatekeeper on Gateway Token contract. TxHash: ${hash}`
    );
  }
}
