import { utils } from "ethers/lib/ethers"

export const toBytes32 = (text: string): string => {
    return utils.formatBytes32String(text);
}