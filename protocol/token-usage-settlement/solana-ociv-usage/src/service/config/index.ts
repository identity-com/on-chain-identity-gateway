import * as os from "os";
import * as path from "path";
import * as yaml from "yaml";
import * as fs from "fs";
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { ExtendedCluster, getClusterUrl } from "../../util/connection";

const DEFAULT_CONFIG_FILE = path.join(
  os.homedir(),
  ".config",
  "gateway",
  "solana-usage.yml"
);

const DEFAULT_CLUSTER: ExtendedCluster = "devnet";
const DEFAULT_COMMITMENT: Commitment = "confirmed";

export type InstructionConfig = {
  name: string;
  mask: Uint8Array;
  gatewayTokenPosition: number;
  ownerPosition: number;
};

export type UsageConfig = {
  name: string;
  program: PublicKey;
  mask: [number, number]; // byte offset, byte length
  maskMaxLength: number;
  instructions: { [key: string]: InstructionConfig }; // keyed by mask
};

export type ConfigFile = {
  cluster: ExtendedCluster;
  configs: UsageConfig[];
};

const parseRawConfig = (rawConfig: any): ConfigFile => {
  const configs: UsageConfig[] = rawConfig.configs.map((config: any) => {
    const instructions: { [key: string]: InstructionConfig } = {};
    config.instructions.forEach((instruction: any) => {
      const mask = Uint8Array.from(Buffer.from(instruction.mask, "hex"));
      instructions[instruction.mask] = {
        name: instruction.name,
        mask,
        gatewayTokenPosition: instruction.gatewayTokenPosition,
        ownerPosition: instruction.ownerPosition,
      };
    });
    return {
      name: config.name,
      program: new PublicKey(config.program),
      mask: config.mask,
      maskMaxLength: config.mask[0] + config.mask[1],
      instructions,
    };
  });

  return {
    cluster: rawConfig.cluster || DEFAULT_CLUSTER,
    configs,
  };
};

export class Config {
  config: ConfigFile;

  readonly connection: Connection;

  constructor(readonly configPath: string = DEFAULT_CONFIG_FILE) {
    if (!fs.existsSync(configPath))
      throw new Error(`No config at ${configPath}. Have you run cryptid init?`);

    const configFileString = fs.readFileSync(configPath, { encoding: "utf-8" });
    const rawConfig = yaml.parse(configFileString);
    this.config = parseRawConfig(rawConfig);

    const clusterUrl =
      this.config.cluster === "localnet"
        ? "http://localhost:8899"
        : getClusterUrl(this.config.cluster);
    this.connection = new Connection(clusterUrl, DEFAULT_COMMITMENT);
  }

  static init(
    overwrite: boolean,
    configPath: string = DEFAULT_CONFIG_FILE,
    cluster: ExtendedCluster = DEFAULT_CLUSTER
  ): Config {

    const configObject: ConfigFile = {
      cluster,
      configs: [],
    };

    if (fs.existsSync(configPath)) {
      if (!overwrite)
        throw new Error(`Config file at ${configPath} already exists.`);
    } else {
      console.log(`Creating config at path ${path.dirname(configPath)}`);
      if (!fs.existsSync(path.dirname(configPath)))
        fs.mkdirSync(path.dirname(configPath));
    }

    fs.writeFileSync(configPath, yaml.stringify(configObject));

    return new Config(configPath);
  }

  set<K extends keyof ConfigFile>(key: K, value: ConfigFile[K]): void {
    if (key !== "cluster")
      throw new Error("Can only set field " + key + " with this command");

    const configObject: ConfigFile = {
      ...this.config,
      [key]: value,
    };

    fs.writeFileSync(this.configPath, yaml.stringify(configObject));

    this.config = configObject;
  };



  show(): string {
    return yaml.stringify(this.config);
  }
}
