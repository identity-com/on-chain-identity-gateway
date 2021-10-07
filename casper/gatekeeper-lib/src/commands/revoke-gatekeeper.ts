import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { CLPublicKey } from "casper-js-sdk";
import { readConfig } from "../util/config";
import { getNetworkService } from "../util/connection";

export default class RevokeGatekeeper extends Command {
  static description = "Revoke a gatekeeper from a network";

  static examples = [
    `$ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
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
      description: "The address of the gatekeeper to remove from the network",
      parse: (input: string) => CLPublicKey.fromHex(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(RevokeGatekeeper);

    const config = readConfig(flags.config);
    const gatekeeper = args.address;
    this.log(`Removing:
      gatekeeper ${gatekeeper.toHex()} 
      from network ${config.networkKey}`);

    const networkService = getNetworkService(config);
    const deployHash = await networkService.revokeGatekeeper(
      gatekeeper,
      config.whitelistPaymentAmount
    );

    this.log(` ... invoked: ${deployHash}`);
  }
}
