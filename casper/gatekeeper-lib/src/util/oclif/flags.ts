import { flags } from "@oclif/command";

export const configFlag = flags.build<string>({
  char: "c",
  parse: (i) => i,
  default: () => "./config.json",
  description: "Configuration file for commands",
});
