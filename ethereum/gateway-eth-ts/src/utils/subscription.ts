import { BaseProvider, Provider } from "@ethersproject/providers";
import { BigNumber } from "ethers";
import { TokenData } from "..";
import { GatewayToken } from "../contracts/GatewayToken";
import { parseTokenState } from "./token-state";

export const onGatewayTokenChange = async (
    provider: Provider | BaseProvider, 
    tokenId: BigNumber | string,
    gatewayToken: GatewayToken,
    callback: (gatewayToken: TokenData) => void
): Promise<ReturnType<typeof setInterval>> => {
    let block = await provider.getBlockNumber();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return setInterval(async () => {
        const latestBlockNumber = await provider.getBlockNumber();
        if (block !== latestBlockNumber) {
            block = latestBlockNumber;
            const token = await gatewayToken.getToken(tokenId);
            const tokenData = parseTokenState(token);
            callback(tokenData);
        }
    }, 1000);
}

export const removeGatewayTokenChangeListener = (listenerId: number): void => {
    return clearInterval(listenerId);
}
