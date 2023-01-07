import {
  gatekeeperNetworkFlag,
  gatewayTokenAddressFlag,
  networkFlag, parseFlags,
} from '../utils/oclif/flags'
import {Command, Flags} from '@oclif/core'
import {addressArg} from '../utils/oclif/args'
import {makeGatewayTs} from '../utils/oclif/utils'
import {TokenState} from '@identity.com/gateway-eth-ts'

export default class GetToken extends Command {
  static description = 'Get existing gateway token';

  static examples = [
    `$ gateway get 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
		`,
  ];

  static aliases = ['verify'];

  static flags = {
    help: Flags.help({char: 'h'}),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    gatekeeperNetwork: gatekeeperNetworkFlag(),
    network: networkFlag(),
  };

  static args = [addressArg({description: 'Token owner address'})];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(GetToken)

    const ownerAddress = args.address as string
    const parsedFlags = parseFlags(flags)

    this.log(`Getting token for ${ownerAddress}`)

    const gateway = await makeGatewayTs(parsedFlags)

    const token = await gateway.getToken(
      ownerAddress, parsedFlags.gatekeeperNetwork,
    )

    this.log('Token:', {
      owner: token.owner,
      state: TokenState[token.state],
      tokenId: token.tokenId.toString(),
      expiration: token.expiration.toString(),
      bitmask: token.bitmask.toString(),
    })
  }
}
