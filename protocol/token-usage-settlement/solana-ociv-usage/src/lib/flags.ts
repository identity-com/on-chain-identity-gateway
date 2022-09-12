import { Flags } from "@oclif/core";

export const config = Flags.string({
  char: "c",
  description: "Path to config file",
  default: process.env.SOLANA_USAGE_CONFIG,
});

export const common = {
  help: Flags.help({ char: "h" }),
  config,
};
