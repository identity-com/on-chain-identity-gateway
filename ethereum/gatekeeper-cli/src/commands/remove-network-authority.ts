import {Command, Flags} from '@oclif/core'

import {makeGatewayTs} from '../utils/oclif/utils'
import {
  confirmationsFlag,
  feesFlag, gatekeeperNetworkFlag,
  gatewayTokenAddressFlag,
  chainFlag, parseFlagsWithPrivateKey,
  privateKeyFlag, gasLimitFlag,
} from '../utils/oclif/flags'
import {addressArg} from '../utils/oclif/args'

export default class RemoveNetworkAuthority extends Command {
  static description = 'Remove a network authority from a gatekeeper network';

  static examples = [
    `$ gateway-eth remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    gatekeeperNetwork: gatekeeperNetworkFlag(),
    chain: chainFlag(),
    fees: feesFlag(),
    gasLimit: gasLimitFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [addressArg({description: 'Network authority address to add to the gatekeeper network'})];
  async run(): Promise<void> {
    const {args, flags} = await this.parse(RemoveNetworkAuthority)

    const confirmations = flags.confirmations

    const authority = args.address as string
    const parsedFlags = parseFlagsWithPrivateKey(flags)

    this.log(`Removing:
			authority ${authority}
			from network ${parsedFlags.gatekeeperNetwork}`)

    const gateway = await makeGatewayTs(parsedFlags)
    const sendableTransaction = await gateway.addNetworkAuthority(authority, parsedFlags.gatekeeperNetwork)

    const receipt = await sendableTransaction.wait(confirmations)

    this.log(
      `Removed network authority from network. TxHash: ${receipt.transactionHash}`,
    )
  }
}
