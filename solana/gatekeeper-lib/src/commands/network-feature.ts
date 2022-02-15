import { Command, flags } from "@oclif/command";
import { Keypair } from "@solana/web3.js";

import { airdropTo } from "../util";
import { GatekeeperNetworkService } from "../service";
import { clusterFlag, gatekeeperNetworkKeyFlag } from "../util/oclif/flags";
import {
  NetworkFeature,
  UserTokenExpiry,
} from "@identity.com/solana-gateway-ts";
import { getConnectionFromEnv } from "../util/oclif/utils";

type featureOperation = "add" | "remove" | "get";

export const featureOperation = flags.build<featureOperation>({
  parse: (input: string) => {
    switch (input) {
      case "add":
        return input;
      case "remove":
        return input;
      default:
        return "get";
    }
  },
  description: "add, remove, or get a network feature",
  options: ["add", "remove", "get"],
  char: "o",
  default: "get",
});

export default class AddGatekeeper extends Command {
  static description = "Get or Change a Network Feature";
  static examples = [`$ gateway network-feature userTokenExpiry`];

  static flags = {
    help: flags.help({ char: "h" }),
    featureOperation: featureOperation(),
    gatekeeperNetworkKey: gatekeeperNetworkKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "feature",
      required: true,
      description: "The Network Feature Name",
      parse: (input: string) => {
        switch (input) {
          case "userTokenExpiry":
            return new NetworkFeature({
              userTokenExpiry: new UserTokenExpiry({}),
            });
        }
      },
    },
  ];

  async run() {
    const { args, flags } = this.parse(AddGatekeeper);

    const networkFeature: NetworkFeature = args.feature;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;
    const featureOperation = flags.featureOperation;
    this.log(`Performing ${featureOperation} on ${networkFeature.enum}
      in network ${gatekeeperNetwork.publicKey.toBase58()}`);

    this.log(`Cluster config: ${flags.cluster}`);

    const connection = getConnectionFromEnv(flags.cluster);

    const networkService = new GatekeeperNetworkService(
      connection,
      gatekeeperNetwork,
      gatekeeperNetwork
    );

    const hasNetworkFeature = await networkService.hasNetworkFeature(
      networkFeature
    );

    // get case
    if (featureOperation === "get") {
      this.log(
        `${hasNetworkFeature ? "Has" : "Does not have"} ${
          networkFeature.enum
        } set.`
      );
      return;
    }

    await airdropTo(
      connection,
      gatekeeperNetwork.publicKey,
      flags.cluster as string
    );

    if (featureOperation === "add" && !hasNetworkFeature) {
      const featureAddress = await networkService
        .addNetworkFeature("find", networkFeature)
        .then((t) => t.send())
        .then((t) => t.confirm());
    } else if (featureOperation === "remove" && hasNetworkFeature) {
      // remove case
      const featureAddress = await networkService
        .removeNetworkFeature("find", networkFeature)
        .then((t) => t.send())
        .then((t) => t.confirm());
    } else {
      this.log(
        `Not executing ${featureOperation} operation. ${
          networkFeature.enum
        } already ${hasNetworkFeature ? "set" : "not set"}.`
      );
    }
  }
}
