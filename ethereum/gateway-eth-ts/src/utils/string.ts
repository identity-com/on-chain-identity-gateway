import { encodeBytes32String } from "ethers";
export const toBytes32 = (text: string): string => encodeBytes32String(text);
