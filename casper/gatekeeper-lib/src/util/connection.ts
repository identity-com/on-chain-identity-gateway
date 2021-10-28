import { CommandConfig } from "./config";
import { GatekeeperNetworkService, GatekeeperService } from "../service";
import { KycTokenClient } from "@metacask/kyc-token-client";

export const getNetworkService = async (
  config: CommandConfig
): Promise<GatekeeperNetworkService> => {
  const kycTokenClient = new KycTokenClient(
    config.nodeAddress,
    config.chain,
    config.masterKey
  );
  await kycTokenClient.setContractHash(config.contractHash);
  return new GatekeeperNetworkService(kycTokenClient, config.networkKey);
};

export const getService = async (
  config: CommandConfig
): Promise<GatekeeperService> => {
  const kycTokenClient = new KycTokenClient(
    config.nodeAddress,
    config.chain,
    config.masterKey
  );
  await kycTokenClient.setContractHash(config.contractHash);
  return new GatekeeperService(
    kycTokenClient,
    config.masterKey.publicKey,
    config.networkKey
  );
};
