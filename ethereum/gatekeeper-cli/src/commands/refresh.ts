import {Command, Flags} from '@oclif/core'
import {
  confirmationsFlag,
  feesFlag, gatekeeperNetworkFlag,
  gatewayTokenAddressFlag,
  chainFlag, parseFlagsWithPrivateKey,
  privateKeyFlag,
} from '../utils/oclif/flags'
import {makeGatewayTs} from '../utils/oclif/utils'
import {addressArg} from '../utils/oclif/args'
import {BigNumber} from '@ethersproject/bignumber'

export default class RefreshToken extends Command {
  static description =
    'Refresh existing gateway token for Ethereum address';

  static examples = [
    `$ gateway-eth refresh 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 60 -n 123
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

  static args = [addressArg({description: 'Token owner address'}),
    {
      name: 'expiry',
      required: false,
      description: 'Expiry timestamp for newly issued token',
      parse: async (input: string): Promise<BigNumber> => BigNumber.from(input),
      default: BigNumber.from(0),
    }];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(RefreshToken)

    const ownerAddress = args.address as string
    const expiry = args.expiry as BigNumber
    const parsedFlags = parseFlagsWithPrivateKey(flags)

    this.log(`Refreshing token for ${ownerAddress}`)

    const gateway = await makeGatewayTs(parsedFlags)

    const sendableTransaction = await gateway.refresh(
      ownerAddress, parsedFlags.gatekeeperNetwork, expiry,
    )

    this.log(`Transaction hash: ${sendableTransaction.hash}`)

    const receipt = await sendableTransaction.wait(flags.confirmations)

    this.log(`Token refreshed. TxHash: ${receipt.transactionHash}`)
  }
}
