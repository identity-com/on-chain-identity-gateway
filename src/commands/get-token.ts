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
import { TokenData } from "../utils/types";
import { checkTokenState } from "../utils/token-state";

export default class GetToken extends Command {
	static description = "Get information related to gateway token by tokenID";

	static examples = [
		`$ gateway get-token 10
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
			name: "tokenID",
			required: true,
			description: "Owner address to verify identity token for",
			parse: (input: string) => BigNumber.from(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(GetToken);

		const pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet
		const tokenID: BigNumber = args.tokenID;

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		const gatewayTokenAddress: string = flags.gatewayTokenAddress;
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

        const token:TokenData = await gatewayToken.getToken(tokenID);

		this.log(
			`Gateway token information:

            Gateway TokenID: ${tokenID}
            Owner: ${token?.owner} 
            State: ${checkTokenState(token?.state)}
            Identity: ${token?.identity} 
            Expiration: ${token?.expiration.toString()} 
            Bitmask: ${token?.bitmask.toString()}
            on GatewayToken ${gatewayTokenAddress} contract
			`
		);
	}
}