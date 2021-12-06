import { Command, flags } from "@oclif/command";
import { configFlag } from "../util/oclif/flags";
import { readConfig } from "../util/config";
import { getService } from "../util";
import {getLocalExecutor} from "../util/connection";

export default class GetDeploy extends Command {
  static description = "Check status of deployment";

  static examples = [
    `$ gateway get-deploy EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
Frozen
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    config: configFlag(),
  };

  static args = [
    {
      name: "hash",
      required: true,
      description: "Deployment hash",
      parse: (input: string) => input,
    },
  ];

  async run() {
    const { args, flags } = this.parse(GetDeploy);

    const config = readConfig(flags.config);
    const hash = args.hash;
    this.log(`Checking: hash ${hash}`);

    const service = await getService(getLocalExecutor(config), config);

    const result = await service.confirmDeploy(hash);
    if (result) {
      this.log("Deployed.");
    } else {
      this.log(".");
    }
  }
}
