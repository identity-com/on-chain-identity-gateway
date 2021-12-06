import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getNetworkService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class AddAdmin extends Command {
  static description = "Add an admin to a contract";

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
      description: "The address of the admin to add to the contract",
      parse: (input: string) => CLPublicKey.fromHex(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(AddAdmin);

    const config = readConfig(flags.config);
    const admin = args.address;
    this.log(`Adding:
      admin ${admin.toHex()}`);

    const networkService = await getNetworkService(getLocalExecutor(config), config);
    const deployHash = await networkService.addAdmin(
      admin,
      config.whitelistPaymentAmount
    );

    this.log(` ... invoked: ${deployHash}`);
  }
}
