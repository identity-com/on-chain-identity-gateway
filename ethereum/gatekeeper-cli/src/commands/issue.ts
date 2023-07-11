import {Command, Flags} from '@oclif/core'
import {
  bitmaskFlag, confirmationsFlag,
  feesFlag, gatekeeperNetworkFlag, gatewayTokenAddressFlag,
  chainFlag, parseFlagsWithPrivateKey,
  privateKeyFlag, gasLimitFlag,
} from '../utils/oclif/flags'
import {makeGatewayTs} from '../utils/oclif/utils'
import {addressArg} from '../utils/oclif/args'
import {BigNumber} from '@ethersproject/bignumber'
import {makeWeiCharge} from '@identity.com/gateway-eth-ts/dist/utils/charge'
import {Wallet} from '@ethersproject/wallet'

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
    chain: chainFlag(),
    fees: feesFlag(),
    confirmations: confirmationsFlag(),
    gasLimit: gasLimitFlag(),
    bitmask: bitmaskFlag(),
    uri: Flags.string({
      char: 'u',
      name: 'uri',
      required: false,
      description: 'TokenURI to link with the issued token',
    }),
    forwarder: Flags.string({
      char: 'x',
      name: 'forwarder',
      required: false,
      description: 'Forward the transaction to the forwarder contract',
    }),
    charge: Flags.custom<BigNumber>({
      char: 'a',
      name: 'charge',
      required: false,
      parse: async (input: string) => BigNumber.from(input),
      description: 'Charge in native tokens for the transaction',
    })(),
  };

  static args = [
    addressArg({description: 'Token owner address'}),
    {
      name: 'expiry',
      required: false,
      description: 'Expiry timestamp for the issued token',
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

    if (flags.forwarder) {
      const charge = (flags.charge) ?
        makeWeiCharge(flags.charge, (gateway.providerOrWallet as Wallet).address) :
        undefined

      const tx = await gateway
      .forward(flags.forwarder)
      .issue(ownerAddress, parsedFlags.gatekeeperNetwork, expiry, bitmask, charge)

      this.log(`Transaction data: ${tx.data}`)
      this.log(`Recipient: ${tx.to}`)
      this.log(`Value: ${tx.value}`)
      return
    }

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
