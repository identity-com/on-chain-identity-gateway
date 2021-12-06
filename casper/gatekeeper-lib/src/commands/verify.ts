import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getService } from "../util";
import { prettyPrint } from "../util/token";
import {getLocalExecutor} from "../util/connection";

export default class Verify extends Command {
  static description = "Verify a gateway token";

  static examples = [
    `$ gateway verify EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
{
 "issuingGatekeeper": "tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp",
 "gatekeeperNetwork": "48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv",
 "owner": "EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv",
 "status": "Active",
 "expiry": 1234567890
}
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
    const { args, flags } = this.parse(Verify);

    const config = readConfig(flags.config);
    const account = args.account;
    this.log(`Verifying:
      account ${account.toHex()} 
      on network ${config.networkKey}`);

    const service = await getService(getLocalExecutor(config), config);

    const token = await service.findGatewayTokenForOwner(account);

    if (token) {
      this.log(prettyPrint(token));
      return;
    }
    throw Error(`Account ${account.toHex()} has no KYC Token!`);
  }
}
