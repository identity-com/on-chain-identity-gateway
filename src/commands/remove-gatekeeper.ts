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

export default class RemoveGatekeeper extends Command {
	static description = "Remove gatekeeper to a GatewayToken contract";

	static examples = [
		`$ gateway remove-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
			name: "address",
			required: true,
			description: "Gatekeeper address to remove to the GatewayToken contract",
			parse: (input: string) => utils.isAddress(input) ? input : null,
		},
	];

	async run() {
		const { args, flags } = this.parse(RemoveGatekeeper);

		let signer = flags.privateKey;
		const gatekeeper: string = args.address;
		const provider:BaseProvider = flags.networkKey;

		signer = signer.connect(provider);

		const gatewayTokenAddress: string = flags.gatewayTokenAddressKey;

		this.log(`Adding:
			gatekeeper ${gatekeeper} 
			to GatewayToken ${gatewayTokenAddress}`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPriceKey;
		let gasLimit = await gatewayToken.contract.estimateGas.removeGatekeeper(gatekeeper);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await gatewayToken.removeGatekeeper(gatekeeper, txParams);

		this.log(
			`Removed gatekeeper on Gateway Token contract. TxHash: ${tx.hash}`
		);
	}
}