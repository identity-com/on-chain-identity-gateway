import { Command, Flags } from "@oclif/core";
import { Keypair } from "@solana/web3.js";

import { airdropTo, GatekeeperNetworkService } from "@identity.com/solana-gatekeeper-lib";
import {airdropFlag, clusterFlag, gatekeeperNetworkKeyFlag} from "../util/flags";
import {
  NetworkFeature,
  UserTokenExpiry,
} from "@identity.com/solana-gateway-ts";
import { getConnectionFromEnv } from "../util/utils";

type featureOperation = "add" | "remove" | "get";

export const featureOperation = Flags.build<featureOperation>({
  // eslint-disable-next-line @typescript-eslint/require-await
  parse: async (input: string) => {
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

export default class AddNetworkFeature extends Command {
  static description = "Get or Change a Network Feature";
  static examples = [`$ gateway network-feature userTokenExpiry`];

  static flags = {
    help: Flags.help({ char: "h" }),
    featureOperation: featureOperation(),
    gatekeeperNetworkKey: gatekeeperNetworkKeyFlag(),
    cluster: clusterFlag(),
    airdrop: airdropFlag,
  };

  static args = [
    {
      name: "feature",
      required: true,
      description: "The Network Feature Name",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<NetworkFeature | undefined> => {
        switch (input) {
          case "userTokenExpiry":
            return new NetworkFeature({
              userTokenExpiry: new UserTokenExpiry({}),
            });
        }
      },
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddNetworkFeature);

    const networkFeature: NetworkFeature = args.feature as NetworkFeature;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;
    const featureOperation = flags.featureOperation;
    this.log(`Performing ${
      featureOperation ? featureOperation : "//Undefined//"
    } on ${networkFeature.enum}
      in network ${gatekeeperNetwork.publicKey.toBase58()}`);

    this.log(
      `Cluster config: ${
        flags.cluster ? flags.cluster : "//Cluster Undefined//"
      }`
    );

    const connection = getConnectionFromEnv(flags.cluster);

    const networkService = new GatekeeperNetworkService(
      connection,
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

    if (flags.airdrop) {
      await airdropTo(
          connection,
          gatekeeperNetwork.publicKey,
          flags.cluster as string
      );
    }

    // ? Why are the featureAddress variables unused? What are they doing here?

    if (featureOperation === "add" && !hasNetworkFeature) {
      await networkService
        .addNetworkFeature("find", networkFeature)
        .then((t) => t.send())
        .then((t) => t.confirm());
    } else if (featureOperation === "remove" && hasNetworkFeature) {
      // remove case
      await networkService
        .removeNetworkFeature("find", networkFeature)
        .then((t) => t.send())
        .then((t) => t.confirm());
    } else {
      this.log(
        `Not executing ${
          featureOperation ? featureOperation : "undefined"
        } operation. ${networkFeature.enum} already ${
          hasNetworkFeature ? "set" : "not set"
        }.`
      );
    }
  }
}
