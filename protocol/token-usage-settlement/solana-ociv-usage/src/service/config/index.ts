import * as os from "os";
import * as path from "path";
import * as yaml from "yaml";
import * as fs from "fs";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import { ExtendedCluster, getConnection } from "../../util/connection";

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
  gatewayTokenPosition: number | undefined; // optional
  ownerPosition: number | undefined; // optional
  gatekeeperPosition: number | undefined; // optional
  gatekeeperNetworkPosition: number | undefined; // optional
};

export type UsageConfig = {
  name: string;
  program: PublicKey;
  network: PublicKey | undefined;
  mask: [number, number]; // [start, end]
  hasGatekeeperColumn: boolean;
  instructions: { [key: string]: InstructionConfig | undefined }; // keyed by mask
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
        gatekeeperPosition: instruction.gatekeeperPosition,
        gatekeeperNetworkPosition: instruction.gatekeeperNetworkPosition,
        gatewayTokenPosition: instruction.gatewayTokenPosition,
        ownerPosition: instruction.ownerPosition,
      };
    });
    const hasGatekeeperColumn: boolean = config.instructions.some(
      (i: any) => i.gatekeeperPosition !== undefined
    );
    return {
      name: config.name,
      program: new PublicKey(config.program),
      network: config.network ? new PublicKey(config.network) : undefined,
      mask: config.mask,
      hasGatekeeperColumn,
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

    if (this.config.cluster.startsWith("http")) {
      process.env.CLUSTER_URL = this.config.cluster;
    }

    this.connection = getConnection(this.config.cluster, DEFAULT_COMMITMENT);
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
  }

  show(): string {
    return yaml.stringify(this.config);
  }
}
