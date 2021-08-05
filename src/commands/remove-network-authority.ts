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

export default class RemoveNetworkAuthority extends Command {
	static description = "Remove network authority to a GatewayToken contract";

	static examples = [
		`$ gateway remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
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
			name: "address",
			required: true,
			description: "Network authority address to remove to the GatewayToken contract",
			parse: (input: string) => utils.isAddress(input) ? input : null,
		},
	];

	async run() {
		const { args, flags } = this.parse(RemoveNetworkAuthority);

		let pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}
		const authority: string = args.address;

		signer = signer.connect(provider);

		const gatewayTokenAddress: string = flags.gatewayTokenAddress;

		this.log(`Removing:
			network authority ${authority} 
			to GatewayToken ${gatewayTokenAddress}`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		let gasPrice = await flags.gasPrice;
		let gasLimit = await gatewayToken.contract.estimateGas.removeNetworkAuthority(authority);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.removeNetworkAuthority(authority, txParams)).wait();

		this.log(
			`Removed network authority on Gateway Token contract. TxHash: ${tx.transactionHash}`
		);
	}
}