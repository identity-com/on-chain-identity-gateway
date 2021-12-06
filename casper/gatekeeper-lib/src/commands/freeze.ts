import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class Freeze extends Command {
  static description = "Freeze a gateway token";

  static examples = [
    `$ gateway freeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Frozen
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    config: configFlag(),
  };

  static args = [
    {
      name: "account",
      required: true,
      description: "The account holding the KYC Token",
      parse: (input: string) => CLPublicKey.fromHex(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Freeze);

    const config = readConfig(flags.config);
    const account = args.account;
    this.log(`Freezing:
      account ${account.toHex()} 
      on network ${config.networkKey}`);

    const service = await getService(getLocalExecutor(config), config);

    const deployHash = await service.freeze(
      account,
      config.updatePaymentAmount
    );

    this.log(` ... invoked: ${deployHash}`);
  }
}
