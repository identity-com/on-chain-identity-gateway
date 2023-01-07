import { formatBytes32String } from "@ethersproject/strings";
export const toBytes32 = (text: string): string => formatBytes32String(text);
