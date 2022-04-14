import { Provider } from "@ethersproject/providers";
import { BigNumber } from "ethers";
import { TokenData } from "..";
import { GatewayToken } from "../contracts/GatewayToken";
import { parseTokenState } from "./token-state";

export const onGatewayTokenChange = async (
    provider: Provider, 
    tokenId: BigNumber | string,
    gatewayToken: GatewayToken,
    callback: (gatewayToken: TokenData) => void
): Promise<void> => {
	let block = await provider.getBlockNumber();
    const interval = setInterval(async () => {
        const latestBlockNumber = await provider.getBlockNumber()
        if (block !== latestBlockNumber) {
            block = latestBlockNumber
            let token = await gatewayToken.getToken(tokenId);
            let tokenData = parseTokenState(token);
            callback(tokenData);
        }
    }, 1000)
}

