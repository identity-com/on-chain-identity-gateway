import { addresses } from "../lib/addresses";
import { gatewayTokenAddresses, GatewayTokenItem } from "../lib/gatewaytokens";

export interface GatewayTokenItems {
  [address: string]: GatewayTokenItem;
}

export const getGatewayControllerByNetworkID = (networkID = 1): string => {
  return addresses[networkID].gatewayTokenController;
};

export const getFlagsStorageByNetworkID = (networkID = 1): string => {
  return addresses[networkID].flagsStorage;
};

export const getGatewayTokenByName = (
  name: string,
  networkID = 1
): GatewayTokenItem => {
  return gatewayTokenAddresses[networkID].find(
    (gatewayToken: GatewayTokenItem) => {
      return name === gatewayToken.name;
    }
  );
};

export const getGatewayTokenBySymbol = (
  symbol: string,
  networkID = 1
): GatewayTokenItem => {
  return gatewayTokenAddresses[networkID].find(
    (gatewayToken: GatewayTokenItem) => {
      return symbol === gatewayToken.symbol;
    }
  );
};

export const getGatewayTokenByAddress = (
  address: string,
  networkID = 1
): GatewayTokenItem => {
  return gatewayTokenAddresses[networkID].find(
    (gatewayToken: GatewayTokenItem) => {
      return address === gatewayToken.address;
    }
  );
};
