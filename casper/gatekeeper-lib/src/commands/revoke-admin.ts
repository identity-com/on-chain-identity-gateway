import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getNetworkService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class RevokeAdmin extends Command {
  static description = "Revoke an admin";

  static examples = [
    `$ gateway add-admin tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    config: configFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address of the admin to revoke",
      parse: (input: string) => CLPublicKey.fromHex(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(RevokeAdmin);

    const config = readConfig(flags.config);
    const admin = args.address;
    this.log(`Revoking:
      admin ${admin.toHex()}`);

    const networkService = await getNetworkService(getLocalExecutor(config), config);
    const deployHash = await networkService.revokeAdmin(
      admin,
      config.whitelistPaymentAmount
    );

    this.log(` ... invoked: ${deployHash}`);
  }
}
