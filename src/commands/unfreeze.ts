import { Command, flags } from "@oclif/command";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from '@ethersproject/providers';
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { BigNumber, utils } from "ethers";

export default class UnfreezeToken extends Command {
	static description = "Unfreeze existing identity token using TokenID";

	static examples = [
		`$ gateway unfreeze 10
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
			description: "Token ID number to unfreeze",
			parse: (input: any) => Number(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(UnfreezeToken);

		let signer = flags.privateKey;
		const provider:BaseProvider = flags.networkKey;
		signer = signer.connect(provider);
		const tokenID: number = args.tokenID;
		const gatewayTokenAddress: string = flags.gatewayTokenAddressKey;

		this.log(`Unfreezing existing token with TokenID:
			${tokenID} 
			on GatewayToken ${gatewayTokenAddress} contract`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPriceKey;
		let gasLimit = await gatewayToken.contract.estimateGas.unfreeze(tokenID);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await gatewayToken.unfreeze(tokenID, txParams);
		this.log(
			`Unfreezed existing token with TokenID: ${tokenID} TxHash: ${tx.hash}`
		);
	}
}