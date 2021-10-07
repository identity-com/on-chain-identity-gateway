import { CommandConfig } from "./config";
import { GatekeeperNetworkService, GatekeeperService } from "../service";
import { KycTokenClient } from "@metacask/kyc-token-client";

export const getNetworkService = (
  config: CommandConfig
): GatekeeperNetworkService => {
  const kycTokenClient = new KycTokenClient(
    config.nodeAddress,
    config.chain,
    config.contractHash,
    config.masterKey
  );
  return new GatekeeperNetworkService(kycTokenClient, config.networkKey);
};

export const getService = (config: CommandConfig): GatekeeperService => {
  const kycTokenClient = new KycTokenClient(
    config.nodeAddress,
    config.chain,
    config.contractHash,
    config.masterKey
  );
  return new GatekeeperService(
    kycTokenClient,
    config.masterKey.publicKey,
    config.networkKey
  );
};
