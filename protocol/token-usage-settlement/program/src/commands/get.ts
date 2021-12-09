import { Command, flags } from "@oclif/command";
import { getUsage } from "../usage";
import { clusterFlag, pubkeyFlag } from "../lib/cli/flags";
import { initProvider } from "../lib/cli/utils";

export default class Get extends Command {
  static description =
    "Get a dApp's usage of tokens issued by a Gatekeeper in a given time period, as reported by a given oracle";

  static examples = [
    `$ gateway-usage get --epoch 241 --dapp DP4ooqnBGVVfEA277P6qkR1Gdo3SUFQxffqrntAtK7YR --gatekeeper 7jXAJR42hQug1sxEb1uGw54jbQUnyZGQ7B5ULderpcML --oracle BsKUYt8foVub8HKrg42rNiX3bW8JrDaSjjgeKnLnEDu6
Usage record:
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
    gatekeeper: pubkeyFlag({
      char: "g",
      description:
        "The gatekeeper that issued the gateway tokens that were used",
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
    cluster: clusterFlag(),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Get);
    const provider = initProvider(flags.cluster);

    const usage = await getUsage({
      amount: flags.amount,
      epoch: flags.epoch,
      dapp: flags.dapp,
      gatekeeper: flags.gatekeeper,
      oracle: flags.oracle,
      provider,
    });

    this.log(`Usage record:
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
