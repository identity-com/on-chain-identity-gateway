import { Command, flags } from "@oclif/command";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from '@ethersproject/providers';
import { GatewayTokenController } from "../contracts";
import {
		privateKeyFlag,
		networkFlag,
		gasPriceFlag,
        gatewayTokenControllerFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class Blacklist extends Command {
	static description = "Blacklist user globaly in the gateway token system";

	static examples = [
		`$ gateway blacklist 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
		`,
	];

	static flags = {
		help: flags.help({ char: "h" }),
		privateKey: privateKeyFlag(),
		gatewayTokenController: gatewayTokenControllerFlag(),
		network: networkFlag(),
		gasPrice: gasPriceFlag(),
	};

	static args = [
		{
			name: "address",
			required: true,
			description: "User ETH address to blacklist",
			parse: (input: string) => utils.isAddress(input) ? input : null,
		},
	];

	async run() {
		const { args, flags } = this.parse(Blacklist);
		let pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet
		const user: string = args.address;

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		const gatewayTokenAddress: string = flags.gatewayTokenController;
		const controller = new GatewayTokenController(signer, gatewayTokenAddress);

		this.log(`Blacklisting user: ${user}`);

		let gasPrice = await flags.gasPrice;
		let gasLimit = await controller.contract.estimateGas.blacklist(user);

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await controller.blacklist(user, txParams)).wait();

		this.log(
			`Blacklisted user with ${user} address. TxHash: ${tx.transactionHash}`
		);
	}
}