import { Command, flags } from "@oclif/command";
import { BigNumber, utils, Wallet } from "ethers";
import { GatewayToken } from "../contracts/GatewayToken";
import { BaseProvider } from '@ethersproject/providers';
import {
	privateKeyFlag,
	gatewayTokenAddressFlag,
	networkFlag,
} from "../utils/flags";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class VerifyToken extends Command {
	static description = "Verify existing identity using token owner address";

	static examples = [
		`$ gateway verify 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
	];

	static flags = {
		help: flags.help({ char: "h" }),
		privateKey: privateKeyFlag(),
		gatewayTokenAddress: gatewayTokenAddressFlag(),
		network: networkFlag(),
	};

	static args = [
		{
			name: "address",
			required: true,
			description: "Owner address to verify identity token for",
			parse: (input: string) => utils.isAddress(input) ? input : null,
		},

		{
			name: "tokenId",
			required: false,
			description: "Token ID to verify identity for",
			parse: (input: string) => BigNumber.from(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(VerifyToken);

		const pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		const ownerAddress: string = args.address;
		const gatewayTokenAddress: string = flags.gatewayTokenAddress;
		const tokenId: BigNumber = args.tokenId;

		this.log(`Verifying existing identity token using owner address:
			${ownerAddress} 
			on GatewayToken ${gatewayTokenAddress} contract`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let tx: any;

		if (tokenId) {
			tx = await gatewayToken.verifyTokenByTokenID(ownerAddress, tokenId);
		} else  {
			tx = await gatewayToken.verifyToken(ownerAddress);
		}

		this.log(
			tx[0] ? 
			`Verified existing token for owner address: ${ownerAddress}
			`
			:
			`Unable to verify identity token for owner address: ${ownerAddress}
			`
		);
	}
}