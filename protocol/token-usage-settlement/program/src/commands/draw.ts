import { Command, flags } from "@oclif/command";
import { draw } from "../draw";
import { clusterFlag, pubkeyFlag } from "../lib/cli/flags";
import { initProvider } from "../lib/cli/utils";

export default class Draw extends Command {
  static description =
    "[Gatekeeper] Draw down funds from a dApp's account for a particular usage record";

  static examples = [
    `$ gateway-usage draw --epoch 241 --dapp DP4ooqnBGVVfEA277P6qkR1Gdo3SUFQxffqrntAtK7YR  --oracle BsKUYt8foVub8HKrg42rNiX3bW8JrDaSjjgeKnLnEDu6 --token DJbQzyhvNAGcy2K2JiF3Ee7qo997BeRtDapoWKhAx9iy
Drawn tokens according to the usage record:
account: 14W8MK4RCW65LCVhiEXUWVig8PcbA3ADhr5EXMazMUfr
dApp: DP4ooqnBGVVfEA277P6qkR1Gdo3SUFQxffqrntAtK7YR
gatekeeper: 7jXAJR42hQug1sxEb1uGw54jbQUnyZGQ7B5ULderpcML
oracle: BsKUYt8foVub8HKrg42rNiX3bW8JrDaSjjgeKnLnEDu6
epoch: 243
amount: 100
paid: false
`,
  ];

  static flags: flags.Input<any> = {
    help: flags.help({ char: "h" }),
    epoch: flags.integer({
      char: "e",
      description: "The epoch or period that the usage refers to",
      required: true,
    }),
    dapp: pubkeyFlag({
      char: "d",
      description: "The dApp that used the gateway tokens",
      required: true,
    }),
    oracle: pubkeyFlag({
      char: "o",
      description: "The oracle that registered the usage",
      required: true,
    }),
    token: pubkeyFlag({
      char: "t",
      description: "The token that the usage is paid in",
      required: true,
    }),
    cluster: clusterFlag(),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Draw);
    const provider = initProvider(flags.cluster);

    const usage = await draw({
      epoch: flags.epoch,
      dapp: flags.dapp,
      oracle: flags.oracle,
      token: flags.token,
      gatekeeperProvider: provider,
    });

    this.log(`Drawn tokens according to the usage record:
account: ${usage.id}
dApp: ${usage.dapp}
gatekeeper: ${usage.gatekeeper}
oracle: ${usage.oracle}
epoch: ${usage.epoch}
amount: ${usage.amount}
paid: ${usage.paid}
`);
  }
}
