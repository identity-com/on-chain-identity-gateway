import {Command, Flags} from '@oclif/core'

import {makeGatewayTs} from '../utils/oclif/utils'
import {
  confirmationsFlag, DEFAULT_GATEKEEPER_NETWORK,
  feesFlag, gatewayTokenAddressFlag, chainFlag, parseFlagsWithPrivateKey,
  privateKeyFlag, gasLimitFlag,
} from '../utils/oclif/flags'

export default class RenameGatekeeperNetwork extends Command {
  static description = 'Rename a gatekeeper network';

  static examples = [
    `$ gateway-eth rename-gatekeeper-network <name> <number>
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    privateKey: privateKeyFlag(),
    chain: chainFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    fees: feesFlag(),
    gasLimit: gasLimitFlag(),
    confirmations: confirmationsFlag(),
  };

  static args = [
    {name: 'id', required: true, description: 'ID of the new network'},
    {name: 'name', required: true, description: 'New name of the new network'},
  ];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(RenameGatekeeperNetwork)

    const confirmations = flags.confirmations

    const parsedFlags = parseFlagsWithPrivateKey({...flags, gatekeeperNetwork: DEFAULT_GATEKEEPER_NETWORK})

    this.log(`Renaming gatekeeper network:
			id ${args.id}
			name ${args.name}`)

    const gateway = await makeGatewayTs(parsedFlags)
    const sendableTransaction = await gateway.renameNetwork(args.name, BigInt(args.id))

    const receipt = await sendableTransaction.wait(confirmations)

    this.log(
      `Renamed Gatekeeper Network. TxHash: ${receipt.transactionHash}`,
    )
  }
}
