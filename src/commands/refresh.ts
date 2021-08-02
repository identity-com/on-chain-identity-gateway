import { Command, flags } from "@oclif/command";
import { BaseProvider } from '@ethersproject/providers';
import { GatewayToken } from "../contracts/GatewayToken";
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { BigNumber, utils } from "ethers";

export default class RefreshToken extends Command {
	static description = "Refresh existing identity token with TokenID for Ethereum address";

	static examples = [
		`$ gateway refresh 10 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
			description: "Token ID number to refresh",
			parse: (input: any) => Number(input),
		},
		{
				name: "expiry",
				required: false,
				description: "The new expiry time in seconds for the gateway token (default 14 days)",
				default: 86400 * 14, // 14 days
				parse: (input: string) => Number(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(RefreshToken);

		let signer = flags.privateKey;
		const provider:BaseProvider = flags.networkKey;
		signer = signer.connect(provider);
		const tokenID: number = args.tokenID;
		const expiry: number = args.expiry;
		var days = Math.floor(expiry / 86400);
		const gatewayTokenAddress: string = flags.gatewayTokenAddressKey;

		this.log(`Refreshing existing token with TokenID:
			${tokenID} 
			for ${days} days
			on GatewayToken ${gatewayTokenAddress} contract`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPriceKey;
		let gasLimit = await gatewayToken.contract.estimateGas.setExpiration(tokenID, expiry);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await gatewayToken.setExpiration(tokenID, expiry, txParams);
		this.log(
			`Refreshed token with: ${tokenID} tokenID for ${days} days. TxHash: ${tx.hash}`
		);
	}
}