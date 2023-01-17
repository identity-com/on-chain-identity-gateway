import { BaseProvider, Provider } from "@ethersproject/providers";
import { GatewayTs } from "../service/GatewayTs";
import { TokenData } from "./types";
import { asProvider } from "./provider";

export const onGatewayTokenChange = (
  owner: string,
  network: bigint,
  gateway: GatewayTs,
  callback: (gatewayToken: TokenData) => void
  // eslint-disable-next-line max-params
): ReturnType<typeof setInterval> => {
  const provider = asProvider(gateway.providerOrWallet);
  let block = 0;
  return setInterval(() => {
    // setInterval does not like a promise return value, so we wrap the async function in an IIFE
    void (async () => {
      const latestBlockNumber = await provider.getBlockNumber();
      if (block !== latestBlockNumber) {
        block = latestBlockNumber;
        const token = await gateway.getToken(owner, network);
        callback(token);
      }
    })();
  }, 1000);
};

export const removeGatewayTokenChangeListener = (
  listenerId: ReturnType<typeof setInterval>
): void => {
  return clearInterval(listenerId);
};
