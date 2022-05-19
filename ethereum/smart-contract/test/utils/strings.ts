import { utils } from "ethers";

/**
 * Converts a string into a hex representation of bytes32
 */
export const toBytes32 = (text: string) => utils.formatBytes32String(text);

/**
 * Converts a bytes32 hex string into a utf-8 string
 */
export const fromBytes32 = (bytes32String: string) => utils.parseBytes32String(bytes32String);
