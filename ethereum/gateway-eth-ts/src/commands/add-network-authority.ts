import { Command, flags } from "@oclif/command";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from '@ethersproject/providers';
import { GatewayToken } from "../contracts/GatewayToken";
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		confirmationsFlag,
		gasPriceFeeFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class AddNetworkAuthority extends Command {
	static description = "Add a network authority to a GatewayToken contract";

	static examples = [
		`$ gateway add-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
	];

	static flags = {
		help: flags.help({ char: "h" }),
		privateKey: privateKeyFlag(),
		gatewayTokenAddress: gatewayTokenAddressFlag(),
		network: networkFlag(),
		gasPriceFee: gasPriceFeeFlag(),
		confirmations: confirmationsFlag(),
	};

	static args = [
		{
			name: "address",
			required: true,
			description: "Network authority address to add to the GatewayToken contract",
			parse: (input: string) => utils.isAddress(input) ? input : null,
		},
	];

	async run() {
		const { args, flags } = this.parse(AddNetworkAuthority);

		const pk = flags.privateKey;
		const authority: string = args.address;
		const provider:BaseProvider = flags.network;
		let signer: Wallet

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		const gatewayTokenAddress: string = flags.gatewayTokenAddress;
		const confirmations = flags.confirmations;

		this.log(`Adding:
			network authority ${authority} 
			to GatewayToken ${gatewayTokenAddress}`);
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);

		const gasPrice = await flags.gasPriceFee;
		const gasLimit = await gatewayToken.contract.estimateGas.addNetworkAuthority(authority);

		const txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		let tx: any;

		if (confirmations > 0) {
			tx = await(await gatewayToken.addNetworkAuthority(authority, txParams)).wait(confirmations);
		} else {
			tx = await gatewayToken.addNetworkAuthority(authority, txParams);
		}
		
		this.log(
			`Added network authority to Gateway Token contract. TxHash: ${(confirmations > 0) ? tx.transactionHash : tx.hash}`
		);
	}
}