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

export default class IssueToken extends Command {
	static description = "Issue new identity token with TokenID for Ethereum address";

	static examples = [
		`$ gateway issue 10 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
			description: "Token ID number to issue",
			parse: (input: any) => Number(input),
		},
		{
				name: "address",
				required: true,
				description: "Owner ethereum address to tokenID for",
				parse: (input: string) => utils.isAddress(input) ? input : null,
			},
	];

	async run() {
		const { args, flags } = this.parse(IssueToken);

		let signer = flags.privateKey;
		const provider:BaseProvider = flags.networkKey;

		signer = signer.connect(provider);

		const tokenID: number = args.tokenID;
		const ownerAddress: string = args.address;
		const gatewayTokenAddress: string = flags.gatewayTokenAddressKey;

		this.log(`Issuing new token with TokenID:
			${tokenID} 
			for owner ${ownerAddress}
			on GatewayToken ${gatewayTokenAddress} contract`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPriceKey;
		let gasLimit = await gatewayToken.contract.estimateGas.mint(ownerAddress, tokenID);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await gatewayToken.mint(ownerAddress, tokenID, txParams);
		this.log(
			`Issued new token with TokenID: ${tokenID} to ${ownerAddress} TxHash: ${tx.hash}`
		);
	}
}