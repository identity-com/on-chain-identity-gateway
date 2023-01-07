import {Provider} from '@ethersproject/providers'
import {getSigner} from './signer'
import {GatewayTs} from '@identity.com/gateway-eth-ts'
import {GetTxGasParamsRes} from 'gas-price-oracle'
export const makeGatewayTs = async ({
  provider,
  privateKey,
  gatewayTokenAddress,
  fees,
}: { provider: Provider, privateKey?: string, gatewayTokenAddress: string, fees?: GetTxGasParamsRes }):Promise<GatewayTs> => {
  const signer = privateKey ? getSigner(privateKey, provider) : undefined
  const network = await provider.getNetwork()
  return new GatewayTs(signer || provider, network, gatewayTokenAddress, {...fees})
}
