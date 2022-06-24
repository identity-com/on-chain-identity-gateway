import { GatewayToken } from "../contracts";
import { DEFAULT_GATEWAY_TOKEN } from "../utils/constants";

export interface GatewayTokenItem {
  name: string;
  symbol: string;
  address: string;
  tokenInstance?: GatewayToken;
}

const MAINNET_GATEWAY_TOKENS: GatewayTokenItem[] = [
    {
      name: 'Test Gateway Token',
      symbol: 'tKYC',
      address: '0x0',
    }
];

const ROPSTEN_GATEWAY_TOKENS: GatewayTokenItem[] = [
    {
      name: 'Test Gateway Token',
      symbol: 'tKYC',
      address: DEFAULT_GATEWAY_TOKEN,
    }
];

const RINKEBY_GATEWAY_TOKENS: GatewayTokenItem[] = [
  {
    name: 'Test Gateway Token',
    symbol: 'tKYC',
    address: '0x182ae55852ffE71CaCA87aF3CFa8b4eF895dd051',
  }
];

const LOCALHOST_GATEWAY_TOKENS: GatewayTokenItem[] = [
  {
    name: 'Test-KYC',
    symbol: 'tKYC',
    address: '0xd8058efe0198ae9dD7D563e1b4938Dcbc86A1F81',
  }
];

export const gatewayTokenAddresses: {[key: number]: GatewayTokenItem[]} = {
  1: MAINNET_GATEWAY_TOKENS,
  3: ROPSTEN_GATEWAY_TOKENS,
  4: RINKEBY_GATEWAY_TOKENS,
  1337: LOCALHOST_GATEWAY_TOKENS,
  31_337: LOCALHOST_GATEWAY_TOKENS, // Hardhat
}