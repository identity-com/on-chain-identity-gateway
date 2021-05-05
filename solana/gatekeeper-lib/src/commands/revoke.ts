import {Command, flags} from '@oclif/command'
import {PublicKey} from '@solana/web3.js'
import {getConnection} from '../util/connection'
import {getGatekeeper} from '../util/account'
import {RevokeService} from '../service/revoke'

export default class Revoke extends Command {
  static description = 'Revoke a gateway token'

  static examples = [
    `$ ociv revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Revoked
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{
    name: 'gatewayToken',
    required: true,
    description: 'The gateway token to revoke',
    parse: (input: string) => new PublicKey(input),
  }]

  async run() {
    const {args} = this.parse(Revoke)

    const gatewayToken: PublicKey = args.gatewayToken
    this.log(`Revoking ${gatewayToken.toBase58()}`)

    const connection = await getConnection()
    const {gatekeeper} = await getGatekeeper(connection)

    const service = new RevokeService(connection, gatekeeper)
    await service.revoke(gatewayToken)

    console.log('Revoked')
  }
}
