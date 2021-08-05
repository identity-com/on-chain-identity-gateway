import { Command, flags } from "@oclif/command";
import { BigNumber, utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from '@ethersproject/providers';
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class FreezeToken extends Command {
	static description = "Freeze existing identity token using TokenID";

	static examples = [
		`$ gateway freeze 10
		`,
	];

	static flags = {
		help: flags.help({ char: "h" }),
		privateKey: privateKeyFlag(),
		gatewayTokenAddress: gatewayTokenAddressFlag(),
		network: networkFlag(),
		gasPrice: gasPriceFlag(),
	};

	static args = [
		{
			name: "tokenID",
			required: true,
			description: "Token ID number to freeze",
			parse: (input: any) => Number(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(FreezeToken);

		let pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}
		
		const tokenID: number = args.tokenID;
		const gatewayTokenAddress: string = flags.gatewayTokenAddress;

		this.log(`Freezing existing token with TokenID:
			${tokenID} 
			on GatewayToken ${gatewayTokenAddress} contract`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPrice;
		let gasLimit = await gatewayToken.contract.estimateGas.freeze(tokenID);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.freeze(tokenID, txParams)).wait();
		this.log(
				`Freezed existing token with TokenID: ${tokenID} TxHash: ${tx.transactionHash}`
			);
	}
}