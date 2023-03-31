import { BigNumber } from "ethers";
import addresses from "../contracts/addresses.json";

export const DEFAULT_FLAGS_STORAGE_ADDRESS = addresses.flagsStorage; // Proxy address
export const DEFAULT_GATEWAY_TOKEN_ADDRESS = addresses.gatewayToken; // Proxy address
export const DEFAULT_FORWARDER_ADDRESS = addresses.forwarder; // Flexible Nonce forwarder

export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ZERO_BN = BigNumber.from("0");
export const ONE_BN = BigNumber.from("1");
