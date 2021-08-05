import { Command, flags } from "@oclif/command";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from '@ethersproject/providers';
import { GatewayToken } from "../contracts/GatewayToken";
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFlag,
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
			description: "Token ID number to burn",
			parse: (input: any) => Number(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(BurnToken);

		const tokenID: number = args.tokenID;
		let pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		const gatewayTokenAddress: string = flags.gatewayTokenAddress;
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);
		const owner = await gatewayToken.getTokenOwner(tokenID);

		this.log(`Burning existing token with TokenID:
			${tokenID} 
			for owner ${owner}
			on GatewayToken ${gatewayTokenAddress} contract`);

		let gasPrice = await flags.gasPrice;
		let gasLimit = await gatewayToken.contract.estimateGas.burn(tokenID);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.burn(tokenID, txParams)).wait();

		this.log(
			`Burned existing token with TokenID: ${tokenID} TxHash: ${tx.transactionHash}`
		);
	}
}