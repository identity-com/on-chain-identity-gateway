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

export default class AddNetworkAuthority extends Command {
  static description = 'Add a network authority to a GatewayToken contract';

  static examples = [
    `$ gateway-eth add-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
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
    const {args, flags} = await this.parse(AddNetworkAuthority)

    const confirmations = flags.confirmations

    const authority = args.address as string
    const parsedFlags = parseFlagsWithPrivateKey(flags)

    this.log(`Adding:
			authority ${authority}
			to network ${parsedFlags.gatekeeperNetwork}`)

    const gateway = await makeGatewayTs(parsedFlags)
    const sendableTransaction = await gateway.addNetworkAuthority(authority, parsedFlags.gatekeeperNetwork)

    const receipt = await sendableTransaction.wait(confirmations)

    this.log(
      `Added network authority to Gateway Token contract. TxHash: ${receipt.transactionHash}`,
    )
  }
}
