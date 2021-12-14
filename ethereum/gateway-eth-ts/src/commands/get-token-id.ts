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

export default class GetTokenID extends Command {
	static description = "Get default gateway token ID by owner's address";

	static examples = [
		`$ gateway get-token-id 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
	];

	async run() {
		const { args, flags } = this.parse(GetTokenID);

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
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

        const tokenId: number | BigNumber = await gatewayToken.getTokenId(ownerAddress);

		this.log(
			`Default gateway token ID  for owner address: ${ownerAddress} 
            is ${tokenId.toString()} on GatewayToken ${gatewayTokenAddress} contract
			`
		);
	}
}