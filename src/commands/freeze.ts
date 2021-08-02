import { Command, flags } from "@oclif/command";
import { BigNumber, utils } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from '@ethersproject/providers';
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";

export default class FreezeToken extends Command {
	static description = "Freeze existing identity token using TokenID";

	static examples = [
		`$ gateway freeze 10
		`,
	];

	static flags = {
		help: flags.help({ char: "h" }),
		privateKey: privateKeyFlag(),
		gatewayTokenAddressKey: gatewayTokenAddressFlag(),
		networkKey: networkFlag(),
		gasPriceKey: gasPriceFlag(),
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

		let signer = flags.privateKey;
		const provider:BaseProvider = flags.networkKey;

		signer = signer.connect(provider);

		const tokenID: number = args.tokenID;
		const gatewayTokenAddress: string = flags.gatewayTokenAddressKey;

		this.log(`Freezing existing token with TokenID:
			${tokenID} 
			on GatewayToken ${gatewayTokenAddress} contract`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPriceKey;
		let gasLimit = await gatewayToken.contract.estimateGas.freeze(tokenID);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await gatewayToken.freeze(tokenID, txParams);
		this.log(
				`Freezed existing token with TokenID: ${tokenID} TxHash: ${tx.hash}`
			);
	}
}