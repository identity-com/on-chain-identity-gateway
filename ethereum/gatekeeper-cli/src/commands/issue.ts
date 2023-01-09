import {Command, Flags} from '@oclif/core'
import {
  bitmaskFlag, confirmationsFlag,
  feesFlag, gatekeeperNetworkFlag, gatewayTokenAddressFlag,
  networkFlag, parseFlagsWithPrivateKey,
  privateKeyFlag,
} from '../utils/oclif/flags'
import {makeGatewayTs} from '../utils/oclif/utils'
import {addressArg} from '../utils/oclif/args'
import {BigNumber} from '@ethersproject/bignumber'

export default class IssueToken extends Command {
  static description =
    'Issue a new gateway token for a given owner address and gatekeeper network';

  static examples = [
    `$ gateway-eth issue 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    privateKey: privateKeyFlag(),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    gatekeeperNetwork: gatekeeperNetworkFlag(),
    network: networkFlag(),
    fees: feesFlag(),
    confirmations: confirmationsFlag(),
    bitmask: bitmaskFlag(),
  };

  static args = [
    addressArg({description: 'Token owner address'}),
    {
      name: 'expiry',
      required: false,
      description: 'Expiry timestamp for newly issued token',
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
      default: BigNumber.from(0),
    },
  ];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueToken)

    const parsedFlags = parseFlagsWithPrivateKey(flags)

    const bitmask = BigNumber.from(flags.bitmask)
    const ownerAddress = args.address as string
    const expiry = args.expiry as BigNumber

    const gateway = await makeGatewayTs(parsedFlags)

    const sendableTransaction = await gateway.issue(
      ownerAddress, parsedFlags.gatekeeperNetwork, expiry, bitmask,
    )

    this.log(`Issuing new token for owner ${ownerAddress}
			on network ${parsedFlags.gatekeeperNetwork}.`)

    this.log(`Transaction hash: ${sendableTransaction.hash}`)

    const receipt = await sendableTransaction.wait(flags.confirmations)

    this.log(`Token issued. TxHash: ${receipt.transactionHash}`)
  }
}
