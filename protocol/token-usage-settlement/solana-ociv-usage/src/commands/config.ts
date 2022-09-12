import Base from "./base";

enum Subcommand {
  SHOW = "show",
  SET = "set",
}

const subcommands = Object.entries(Subcommand).map(([, v]) => v);

export default class Config extends Base {
  static description = "Manage Cryptid configuration";

  static args = [
    { name: "subcommand", options: subcommands, default: "show" },
    { name: "key" },
    { name: "value" },
  ];

  static flags = Base.flags;

  async run(): Promise<void> {
    const { args } = await this.parse(Config);

    switch (args.subcommand) {
      case Subcommand.SHOW:
        this.log(this.usageConfig.configPath);
        this.log(this.usageConfig.show());
        break;
      case Subcommand.SET:
        this.usageConfig.set(args.key, args.value);
        this.log(this.usageConfig.show());
        break;
    }
  }
}
