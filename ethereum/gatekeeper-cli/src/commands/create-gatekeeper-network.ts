import {Command, Flags} from '@oclif/core'

import {makeGatewayTs} from '../utils/oclif/utils'
import {
  confirmationsFlag, DEFAULT_GATEKEEPER_NETWORK,
  feesFlag, gatewayTokenAddressFlag, chainFlag, parseFlagsWithPrivateKey,
  privateKeyFlag,
} from '../utils/oclif/flags'

export default class CreateGatekeeperNetwork extends Command {
  static description = 'Create a new gatekeeper network';

  static examples = [
    `$ gateway-eth create-gatekeeper-network <name> <number>
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    privateKey: privateKeyFlag(),
    chain: chainFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    fees: feesFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {name: 'id', required: true, description: 'ID of the new network'},
    {name: 'name', required: true, description: 'Name of the new network'},
  ];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(CreateGatekeeperNetwork)

    const confirmations = flags.confirmations

    const parsedFlags = parseFlagsWithPrivateKey({...flags, gatekeeperNetwork: DEFAULT_GATEKEEPER_NETWORK})

    this.log(`Creating gatekeeper network:
			id ${args.id}
			name ${args.name}`)

    const gateway = await makeGatewayTs(parsedFlags)
    const sendableTransaction = await gateway.createNetwork(args.name, BigInt(args.id), false)

    const receipt = await sendableTransaction.wait(confirmations)

    this.log(
      `Created Gatekeeper Network. TxHash: ${receipt.transactionHash}`,
    )
  }
}
