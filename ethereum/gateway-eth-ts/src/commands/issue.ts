import { Command, Flags } from "@oclif/core";
import { BigNumber, utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from "@ethersproject/providers";
import {
  privateKeyFlag,
  gatewayTokenAddressFlag,
  networkFlag,
  gasPriceFeeFlag,
  confirmationsFlag,
  generateTokenIdFlag,
  bitmaskFlag,
  tokenIdFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";
import { generateId } from "../utils/tokenId";
import { getExpirationTime } from "../utils/time";

export default class IssueToken extends Command {
  static description =
    "Issue new identity token with TokenID for Ethereum address";

  static examples = [
    `$ gateway issue 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -i <TokenID>
		`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    network: networkFlag(),
    gasPriceFee: gasPriceFeeFlag(),
    confirmations: confirmationsFlag(),
    generateTokenId: generateTokenIdFlag,
    bitmask: bitmaskFlag(),
    tokenID: tokenIdFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner ethereum address to tokenID for",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<string> => {
        if (!utils.isAddress(input)) {
          throw new Error("Invalid address");
        }

        return input;
      }
    },
    {
      name: "expiration",
      required: false,
      description: "Expiration timestamp for newly issued token",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: any): Promise<BigNumber> => BigNumber.from(input),
      default: 0,
    },
    {
      name: "constrains",
      required: false,
      description: "Constrains to generate tokenId",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: any): Promise<BigNumber> => BigNumber.from(input),
      default: BigNumber.from("0"),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(IssueToken);

    const pk = flags.privateKey;
    const provider: BaseProvider = flags.network;
    const confirmations = flags.confirmations;

    const signer: Wallet = utils.isValidMnemonic(pk)
      ? mnemonicSigner(pk, provider)
      : privateKeySigner(pk, provider);

    let tokenID: BigNumber = flags.tokenID;
    const generateTokenId: boolean = flags.generateTokenId;
    const bitmask: BigNumber = flags.bitmask;
    const ownerAddress = args.address as string;
    let expiration = args.expiration as BigNumber;
    const constrains = args.constrains as BigNumber;
    const gatewayTokenAddress: string = flags.gatewayTokenAddress;

    const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

    if (generateTokenId && tokenID === null) {
      tokenID = generateId(ownerAddress, constrains);
    }

    const gasPrice = flags.gasPriceFee;

    if (expiration.gt(0)) {
      expiration = getExpirationTime(expiration);
    }

    const gasLimit: BigNumber = await gatewayToken.contract.estimateGas.mint(
      ownerAddress,
      tokenID,
      expiration,
      bitmask
    );

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), "gwei")),
    };

    this.log(`Issuing new token with TokenID:
			${tokenID.toString()} 
			for owner ${ownerAddress}
			on GatewayToken ${gatewayTokenAddress} contract`);

    const tx = await gatewayToken.mint(
      ownerAddress,
      tokenID,
      expiration,
      bitmask,
      txParams
    );
    let hash = tx.hash;
    if (confirmations > 0) {
      hash = (await tx.wait(confirmations)).transactionHash
    }

    this.log(
      `Issued new token with TokenID: ${tokenID.toString()} to ${ownerAddress} TxHash: ${hash}`
    );
  }
}
