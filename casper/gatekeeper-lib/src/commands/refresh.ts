import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class Refresh extends Command {
  static description = "Refresh a gateway token";

  static examples = [
    `$ gateway refresh EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv 54000
Refreshed
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
      description: "The account to issue the KYC Token to",
      parse: (input: string) => CLPublicKey.fromHex(input),
    },
    {
      name: "expiry",
      description:
        "The new expiry time in seconds for the gateway token (default 15 minutes)",
      default: 15 * 60 * 60, // 15 minutes
      parse: (input: string) => Number(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Refresh);

    const config = readConfig(flags.config);
    const account = args.account;
    this.log(`Refreshing:
      account ${account.toHex()} 
      on network ${config.networkKey}`);

    const service = await getService(getLocalExecutor(config), config);
    const now = Math.floor(Date.now() / 1000);
    const deployHash = await service.updateExpiry(
      account,
      now + args.expiry,
      config.updatePaymentAmount
    );

    this.log(` ... invoked: ${deployHash}`);
  }
}
