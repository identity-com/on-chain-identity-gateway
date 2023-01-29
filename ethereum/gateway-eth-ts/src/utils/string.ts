import { utils } from "ethers";
export const toBytes32 = (text: string): string =>
  utils.formatBytes32String(text);
