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
  forwardTransactionFlag,
} from "../utils/flags";
import { TxBase, TxOptions } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";
import { generateId } from "../utils/tokenId";
import { getExpirationTime } from "../utils/time";
import { GatewayETH } from "..";
import { SentTransaction } from "../utils/types";

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
	forwardTransaction: forwardTransactionFlag,
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "Owner ethereum address to tokenID for",
      parse: async (input: string): Promise<string> =>
        utils.isAddress(input) ? input : null,
    },
    {
      name: "expiration",
      required: false,
      description: "Expiration timestamp for newly issued token",
      parse: async (input: any): Promise<BigNumber> => BigNumber.from(input),
      default: 0,
    },
    {
      name: "constrains",
      required: false,
      description: "Constrains to generate tokenId",
      parse: async (input: any): Promise<BigNumber> => BigNumber.from(input),
      default: BigNumber.from("0"),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(IssueToken);

		const pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet
		const confirmations = flags.confirmations;

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		let tokenID: BigNumber = flags.tokenID;
		const generateTokenId: boolean = flags.generateTokenId;
		const bitmask: BigNumber = flags.bitmask;
		const ownerAddress: string = args.address;
		let expiration: BigNumber = args.expiration;
		const constrains: BigNumber = args.constrains;
		const gatewayTokenAddress: string = flags.gatewayTokenAddress;
		const forwardTransaction = flags.forwardTransaction;

		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		if (generateTokenId && tokenID == null) {
			tokenID = generateId(ownerAddress, constrains);
		}

		const gasPrice = flags.gasPriceFee;
		let gasLimit: BigNumber 
		
		if (expiration.gt(0)) {
			expiration = getExpirationTime(expiration);
		}

		gasLimit = await gatewayToken.contract.estimateGas.mint(ownerAddress, tokenID, expiration, bitmask);

		const txParams: TxOptions = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
			confirmations,
			forwardTransaction,
		};

		const gateway = new GatewayETH(provider, signer);
		await gateway.init();
		const sendableTransaction = await gateway.issue(
			ownerAddress, 
			tokenID, 
			expiration, 
			bitmask, 
			null, 
			gatewayTokenAddress,
			txParams
		);

		this.log(`Issuing new token with TokenID:
			${tokenID} 
			for owner ${ownerAddress}
			on GatewayToken ${gatewayTokenAddress} contract`
		);
		
		if (confirmations > 0) {
			const tx = (await sendableTransaction.send()).confirm();
			this.log(
				`Issued new token with TokenID: ${tokenID} to ${ownerAddress} TxHash: ${(await tx).transactionHash}}`
			);
		} else {
			const tx: SentTransaction = await sendableTransaction.send();
			this.log(
				`Issued new token with TokenID: ${tokenID} to ${ownerAddress} TxHash: ${tx.response.hash}}`
			);
		}
	}
}
