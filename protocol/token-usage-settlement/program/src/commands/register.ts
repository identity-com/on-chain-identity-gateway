import { Command, flags } from "@oclif/command";
import { registerUsage } from "../usage";
import { clusterFlag, pubkeyFlag } from "../lib/cli/flags";
import { initProvider } from "../lib/cli/utils";
import { BN } from "@project-serum/anchor";

export default class Register extends Command {
  static description =
    "[Oracle] Register a dApp's usage of tokens issued by a Gatekeeper in a given time period";

  static examples = [
    `$ gateway-usage register --amount 100 --epoch 241 --dapp DP4ooqnBGVVfEA277P6qkR1Gdo3SUFQxffqrntAtK7YR --gatekeeper 7jXAJR42hQug1sxEb1uGw54jbQUnyZGQ7B5ULderpcML
Registered usage
`,
  ];

  static flags: flags.Input<any> = {
    help: flags.help({ char: "h" }),
    epoch: flags.integer({
      char: "e",
      description: "The epoch or period that the usage refers to",
      required: true,
    }),
    amount: flags.integer({
      char: "a",
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
    cluster: clusterFlag(),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Register);
    const provider = initProvider(flags.cluster);

    const usageAccount = await registerUsage({
      amount: new BN(flags.amount),
      epoch: flags.epoch,
      dapp: flags.dapp,
      gatekeeper: flags.gatekeeper,
      oracleProvider: provider,
    });

    this.log(`Registered usage. Account : ${usageAccount.toString()}`);
  }
}
