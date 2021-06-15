import { findGatewayToken } from "@identity.com/solana-gateway-ts";
import { Command, flags } from "@oclif/command";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../util/connection";

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
    {
      name: "owner",
      required: true,
      description: "The expected gateway token owner",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args } = this.parse(Verify);

    const gatewayToken: PublicKey = args.gatewayToken;
    const owner: PublicKey = args.owner;
    const gatekeeperNetwork = new PublicKey(
      process.env.GATEKEEPER_NETWORK as string
    );
    this.log(`Using network ${gatekeeperNetwork.toBase58()}`);
    this.log(
      `Verifying ${gatewayToken.toBase58()} is valid and belongs to ${owner.toBase58()}`
    );
    const connection = await getConnection();
    const token = await findGatewayToken(connection, owner, gatekeeperNetwork);

    const result = token?.publicKey.toBase58() === gatewayToken.toBase58();
    this.log(`Verify result: ${result}`);
  }
}
