import {Command, Flags} from '@oclif/core'

import {makeGatewayTs} from '../utils/oclif/utils'
import {
  DEFAULT_GATEKEEPER_NETWORK,
  gatewayTokenAddressFlag, chainFlag, parseFlags,
} from '../utils/oclif/flags'

export default class GetGatekeeperNetwork extends Command {
  static description = 'Check if a gatekeeper network exists';

  static examples = [
    `$ gateway-eth get-gatekeeper-network <number>
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    chain: chainFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
  };

  static args = [
    {name: 'id', required: true, description: 'ID of the network'},
  ];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(GetGatekeeperNetwork)

    const parsedFlags = parseFlags({...flags, readOnly: true, gatekeeperNetwork: DEFAULT_GATEKEEPER_NETWORK})

    const gateway = await makeGatewayTs(parsedFlags)
    const name = await gateway.getGatekeeperNetwork(args.id)

    if (!name || name === '') {
      const network = await parsedFlags.provider.getNetwork()
      this.log(`Network ${args.id} does not exist on ${network.name}`)
    } else {
      this.log(
        `Gateway network ${args.id} has name ${name}`,
      )
    }
  }
}
