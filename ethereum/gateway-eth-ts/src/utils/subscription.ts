import { BaseProvider, Provider } from "@ethersproject/providers";
import { GatewayTs } from "../service/GatewayTs";
import { TokenData } from "./types";

export const onGatewayTokenChange = async (
  provider: Provider | BaseProvider,
  owner: string,
  network: bigint,
  gateway: GatewayTs,
  callback: (gatewayToken: TokenData) => void
  // eslint-disable-next-line max-params
): Promise<ReturnType<typeof setInterval>> => {
  let block = await provider.getBlockNumber();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return setInterval(async () => {
    const latestBlockNumber = await provider.getBlockNumber();
    if (block !== latestBlockNumber) {
      block = latestBlockNumber;
      const token = await gateway.getToken(owner, network);
      callback(token);
    }
  }, 1000);
};

export const removeGatewayTokenChangeListener = (listenerId: number): void => {
  return clearInterval(listenerId);
};
