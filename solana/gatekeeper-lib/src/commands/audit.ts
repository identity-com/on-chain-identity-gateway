import {Command, flags} from '@oclif/command'
import {PublicKey} from "@solana/web3.js";
import {AuditService} from "../service/audit";

export default class Audit extends Command {
  static description = 'Auditing a gateway token'

  static examples = [
    `$ ociv audit EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
{
  gatekeeper: 'CKuXF96Bv2tuzAzs6FSbzmjnvNdbAu1LWXjsCxifGGEm',
  owner: 'Ek6vxQJSwkfBadVRaxstsB8i2vjyRLHwHVWaqA4KgYTB',
  revoked: false
}
`,
  ]

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [{
    name: 'gatewayToken',
    required: true,
    description: 'The gateway token account to verify',
    parse: (input: string) => new PublicKey(input),
  }]

  async run() {
    const {args} = this.parse(Audit)

    const gatewayToken: PublicKey = args.gatewayToken
    this.log(`Auditing ${gatewayToken.toBase58()}`)

    const service = new AuditService();
    const result = await service.audit(gatewayToken);

    console.log(result);
  }
}
