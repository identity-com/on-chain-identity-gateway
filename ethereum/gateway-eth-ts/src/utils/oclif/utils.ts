import {Provider} from "@ethersproject/providers";
import {getSigner} from "./signer";
import {GatewayTs} from "../../GatewayTs";
import {BigNumber} from "ethers";

export const makeGatewayTs = async (provider: Provider, privateKey: string, gatewayTokenAddress: string, gasPrice: number | BigNumber):Promise<GatewayTs> => {
  const signer = getSigner(privateKey, provider);
  const network = await provider.getNetwork();
  return new GatewayTs(signer, network, gatewayTokenAddress, {gasPrice});
}