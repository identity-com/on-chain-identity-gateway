import {
  gatekeeperNetworkFlag,
  gatewayTokenAddressFlag,
  chainFlag, parseFlags,
} from '../utils/oclif/flags'
import {Command, Flags} from '@oclif/core'
import {addressArg} from '../utils/oclif/args'
import {makeGatewayTs} from '../utils/oclif/utils'
import {TokenState} from '@identity.com/gateway-eth-ts'
import {BigNumber} from '@ethersproject/bignumber'

export default class GetToken extends Command {
  static description = 'Listen to changes on a gateway token';

  static examples = [
    `$ gateway-eth listen 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
		`,
  ];

  static flags = {
    help: Flags.help({char: 'h'}),
    gatewayTokenAddress: gatewayTokenAddressFlag(),
    gatekeeperNetwork: gatekeeperNetworkFlag(),
    chain: chainFlag(),
  };

  static args = [addressArg({description: 'Token owner address'})];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(GetToken)

    const ownerAddress = args.address as string
    const parsedFlags = parseFlags(flags)

    this.log(`Getting token for ${ownerAddress}`)

    const gateway = await makeGatewayTs(parsedFlags)

    gateway.onGatewayTokenChange(
      ownerAddress, parsedFlags.gatekeeperNetwork, token => {
        if (token) {
          this.log('Token:', {
            owner: token.owner,
            state: TokenState[token.state],
            tokenId: token.tokenId.toString(),
            expiration: new Date(
              BigNumber
              .from(token.expiration)
              .mul(BigNumber.from(1000))
              .toNumber(),
            ).toISOString(),
            bitmask: token.bitmask.toString(),
          })
        } else {
          this.log('Token not found')
        }
      },
    )
  }
}
