import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class Issue extends Command {
  static description = "Issue a gateway token to a wallet";

  static examples = [
    `$ gateway issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
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
  ];

  async run() {
    const { args, flags } = this.parse(Issue);

    const config = readConfig(flags.config);
    const account = args.account;
    this.log(`Issuing:
      account ${account.toHex()} 
      on network ${config.networkKey}`);

    const service = await getService(getLocalExecutor(config), config);

    const deployHash = await service.issue(account, config.updatePaymentAmount);

    this.log(` ... invoked: ${deployHash}`);
  }
}
