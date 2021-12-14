import { Command, flags } from "@oclif/command";
import { clusterFlag, pubkeyFlag } from "../lib/cli/flags";
import { initProvider } from "../lib/cli/utils";
import { delegate } from "../delegateTokens";

export default class Delegate extends Command {
  static description =
    "[dApp] Set up a delegate on a token account that a gatekeeper can use to draw funds";

  static examples = [
    `$ gateway-usage delegate --amount 1000000 --oracle BsKUYt8foVub8HKrg42rNiX3bW8JrDaSjjgeKnLnEDu6 --token DJbQzyhvNAGcy2K2JiF3Ee7qo997BeRtDapoWKhAx9iy
Registered delegate account wjZ2xcF76zoSUgS6C2uJmFQZV67aaTAAGKMQZN4waMt on token account JBtt8CQJqotjDj8gFKi3tfY8Nm1fYKxNihgVrfZxtT91
`,
  ];

  static flags: flags.Input<any> = {
    help: flags.help({ char: "h" }),
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
    amount: flags.integer({
      char: "a",
      description: "The max total amount that a gatekeeper may draw",
      default: 999_999_999,
    }),
    cluster: clusterFlag(),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(Delegate);
    const provider = initProvider(flags.cluster);

    const delegateResult = await delegate({
      oracle: flags.oracle,
      token: flags.token,
      dappProvider: provider,
    });

    this.log(
      `Registered delegate account ${delegateResult.delegateAccount} on token account ${delegateResult.tokenAccount}`
    );
  }
}
