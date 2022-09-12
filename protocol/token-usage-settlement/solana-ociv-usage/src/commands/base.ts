import { Command } from "@oclif/core";
import * as Flags from "../lib/flags";
import { Config } from "../service/config";
import { Connection } from "@solana/web3.js";

export default abstract class Base extends Command {
  protected _config: Config | undefined;

  static flags = Flags.common;

  get usageConfig(): Config {
    if (!this._config) throw new Error("Cannot retrieve config before init()");
    return this._config;
  }

  set usageConfig(config: Config) {
    this._config = config;
  }

  get connection(): Connection {
    return this.usageConfig.connection;
  }

  async init(): Promise<void> {
    // workaround for using static flags and args in base oclif command classes
    // note, each subclass must define its own args and flags to avoid inconsistencies
    // https://github.com/oclif/oclif/issues/225#issuecomment-806318444
    const { flags } = await this.parse(this.ctor as typeof Base);

    this._config = new Config(flags.config);
  }
}
