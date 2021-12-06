import { CommandConfig } from "./config";
import { GatekeeperNetworkService, GatekeeperService } from "../service";
import { KycTokenClient, CasperExecutor, NodeResolver, LocalCasperExecutor, CasperSignerExecutor } from "@metacask/kyc-token-client";

export const getLocalExecutor = (config: CommandConfig): CasperExecutor => {
  const resolver = new NodeResolver(config.nodeAddress, config.chain);
  return new LocalCasperExecutor(resolver, config.masterKey);
}

export const getCasperExecutor = (config: CommandConfig): CasperExecutor => {
  const resolver = new NodeResolver(config.nodeAddress, config.chain);
  return new CasperSignerExecutor(resolver);
}

export const getNetworkService = async (
  executor: CasperExecutor,
  config: CommandConfig
): Promise<GatekeeperNetworkService> => {
  const client = new KycTokenClient(executor);
  await client.setContractHash(config.contractHash);
  return new GatekeeperNetworkService(client, config.networkKey);
};

export const getService = async (
  executor: CasperExecutor,
  config: CommandConfig
): Promise<GatekeeperService> => {
  const client = new KycTokenClient(executor);
  await client.setContractHash(config.contractHash);
  return new GatekeeperService(
    client,
    config.masterKey.publicKey,
    config.networkKey
  );
};
