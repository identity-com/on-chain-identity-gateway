import {Command, Flags} from '@oclif/core'

import {makeGatewayTs} from '../utils/oclif/utils'
import {
  gatewayTokenAddressFlag, chainFlag, parseFlags, gatekeeperNetworkFlag,
} from '../utils/oclif/flags'

export default class IsGatekeeper extends Command {
  static description = 'Check if a gatekeeper is added to a network';

  static examples = [
    `$ gateway-eth is-gatekeeper -n <slot id> <gatekeeper address>
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    chain: chainFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    gatekeeperNetwork: gatekeeperNetworkFlag(),
  };

  static args = [
    {name: 'gatekeeperAddress', required: true, description: 'Address of the Gatekeeper Authority'},
  ];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(IsGatekeeper)

    const parsedFlags = parseFlags({...flags, readOnly: true})

    if (!parsedFlags.gatekeeperNetwork) {
      console.log('Usage:', IsGatekeeper.examples)
      throw new Error('Gatekeeper network not specified')
    }

    const gateway = await makeGatewayTs(parsedFlags)
    const gatekeeperRegistered = await gateway.isGatekeeper(args.gatekeeperAddress, parsedFlags.gatekeeperNetwork)
    console.log(gatekeeperRegistered)
  }
}
