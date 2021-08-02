import { Command, flags } from "@oclif/command";
import { BigNumber, utils } from "ethers";
import { BaseProvider } from '@ethersproject/providers';
import { GatewayToken } from "../contracts/GatewayToken";
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";

export default class BurnToken extends Command {
	static description = "Burn existing identity token using TokenID";

	static examples = [
		`$ gateway burn 10
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
			description: "Token ID number to burn",
			parse: (input: any) => Number(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(BurnToken);

		let signer = flags.privateKey;
		const tokenID: number = args.tokenID;
		const provider:BaseProvider = flags.networkKey;

		signer = signer.connect(provider);

		const gatewayTokenAddress: string = flags.gatewayTokenAddressKey;
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);
		const owner = await gatewayToken.getTokenOwner(tokenID);

		this.log(`Burning existing token with TokenID:
			${tokenID} 
			for owner ${owner}
			on GatewayToken ${gatewayTokenAddress} contract`);

		let gasPrice = await flags.gasPriceKey;
		let gasLimit = await gatewayToken.contract.estimateGas.burn(tokenID);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await gatewayToken.burn(tokenID, txParams);

		this.log(
			`Burned existing token with TokenID: ${tokenID} TxHash: ${tx.hash}`
		);
	}
}