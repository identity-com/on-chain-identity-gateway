import { Command, flags } from "@oclif/command";
import { BigNumber, utils, Wallet } from "ethers";
import { BaseProvider } from '@ethersproject/providers';
import { GatewayToken } from "../contracts/GatewayToken";
import {
		privateKeyFlag,
		gatewayTokenAddressFlag,
		networkFlag,
		gasPriceFeeFlag,
		confirmationsFlag,
} from "../utils/flags";
import { TxBase } from "../utils/tx";
import { mnemonicSigner, privateKeySigner } from "../utils/signer";

export default class BurnToken extends Command {
	static description = "Burn existing identity token using TokenID";

	static examples = [
		`$ gateway burn 10
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
			name: "tokenID",
			required: true,
			description: "Token ID number to burn",
			parse: (input: string) => BigNumber.from(input),
		},
	];

	async run() {
		const { args, flags } = this.parse(BurnToken);

		const tokenID: BigNumber = args.tokenID;
		const pk = flags.privateKey;
		const provider:BaseProvider = flags.network;
		let signer: Wallet
		const confirmations = flags.confirmations;

		if (utils.isValidMnemonic(pk)) {
			signer = mnemonicSigner(pk, provider)
		} else {
			signer = privateKeySigner(pk, provider)
		}

		const gatewayTokenAddress: string = flags.gatewayTokenAddress;
		
		const gatewayToken = new GatewayToken(signer, gatewayTokenAddress);
		const owner = await gatewayToken.getTokenOwner(tokenID);

		this.log(`Burning existing token with TokenID:
			${tokenID.toString()} 
			for owner ${owner}
			on GatewayToken ${gatewayTokenAddress} contract`);

		const gasPrice = await flags.gasPriceFee;
		const gasLimit = await gatewayToken.contract.estimateGas.burn(tokenID);

		const txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		let tx: any;

		if (confirmations > 0) {
			tx = await(await gatewayToken.burn(tokenID, txParams)).wait(confirmations);
		} else {
			tx = await gatewayToken.burn(tokenID, txParams);
		}

		this.log(
			`Burned existing token with TokenID: ${tokenID.toString()} TxHash: ${(confirmations > 0) ? tx.transactionHash : tx.hash}`
		);
	}
}