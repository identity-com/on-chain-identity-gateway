import {
  confirmationsFlag,
  feesFlag, gatekeeperNetworkFlag,
  gatewayTokenAddressFlag,
  chainFlag, parseFlagsWithPrivateKey,
  privateKeyFlag,
} from '../utils/oclif/flags'
import {Command, Flags} from '@oclif/core'
import {makeGatewayTs} from '../utils/oclif/utils'
import {addressArg} from '../utils/oclif/args'

export default class AddGatekeeper extends Command {
  static description = 'Add a gatekeeper to a gatekeeper network';

  static examples = [
    `$ gateway-eth add-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    gatekeeperNetwork: gatekeeperNetworkFlag(),
    chain: chainFlag(),
    fees: feesFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [addressArg({description: 'Gatekeeper address to add to the gatekeeper network'})];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(AddGatekeeper)

    const gatekeeper: string = args.address as string
    const parsedFlags = parseFlagsWithPrivateKey(flags)

    this.log(`Adding:
			gatekeeper ${gatekeeper}
			to network ${parsedFlags.gatekeeperNetwork}`)

    const gateway = await makeGatewayTs(parsedFlags)
    const sendableTransaction = await gateway.addGatekeeper(gatekeeper, parsedFlags.gatekeeperNetwork)

    const receipt = await sendableTransaction.wait(flags.confirmations)

    this.log(
      `Added gatekeeper to Gateway Token contract. TxHash: ${receipt.transactionHash}`,
    )
  }
}
