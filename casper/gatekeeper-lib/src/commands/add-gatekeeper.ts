import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getNetworkService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class AddGatekeeper extends Command {
  static description = "Add a gatekeeper to a network";

  static examples = [
    `$ gateway add-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
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
      description: "The address of the gatekeeper to add to the network",
      parse: (input: string) => CLPublicKey.fromHex(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(AddGatekeeper);

    const config = readConfig(flags.config);
    const gatekeeper = args.address;
    this.log(`Adding:
      gatekeeper ${gatekeeper.toHex()} 
      to network ${config.networkKey}`);

    const networkService = await getNetworkService(getLocalExecutor(config), config);
    const deployHash = await networkService.addGatekeeper(
      gatekeeper,
      config.whitelistPaymentAmount
    );

    this.log(` ... invoked: ${deployHash}`);
  }
}
