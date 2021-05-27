import { Command, flags } from "@oclif/command";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../util/connection";
import { VerifyService } from "../service/verify";

export default class Verify extends Command {
  static description = "Verify a gateway token";

  static examples = [
    `$ ociv verify EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
{
  gatekeeper: 'CKuXF96Bv2tuzAzs6FSbzmjnvNdbAu1LWXjsCxifGGEm',
  owner: 'Ek6vxQJSwkfBadVRaxstsB8i2vjyRLHwHVWaqA4KgYTB',
  revoked: false
}
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [
    {
      name: "gatewayToken",
      required: true,
      description: "The gateway token account to verify",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args } = this.parse(Verify);

    const gatewayToken: PublicKey = args.gatewayToken;
    this.log(`Verifying ${gatewayToken.toBase58()}`);

    const connection = await getConnection();
    const service = new VerifyService(connection);
    const result = await service.verify(gatewayToken);

    console.log(result);
  }
}
