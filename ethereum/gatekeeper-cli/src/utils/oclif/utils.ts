import {Provider} from '@ethersproject/providers'
import {getSigner} from './signer'
import {GatewayTs, TokenData} from '@identity.com/gateway-eth-ts'
import {GetTxGasParamsRes} from 'gas-price-oracle'
export const makeGatewayTs = async ({
  provider,
  privateKey,
  gatewayTokenAddress,
  fees,
}: { provider: Provider, privateKey?: string, gatewayTokenAddress: string, fees?: GetTxGasParamsRes }):Promise<GatewayTs> => {
  const signer = privateKey ? getSigner(privateKey, provider) : undefined
  return new GatewayTs(signer || provider, gatewayTokenAddress, {...fees})
}

export const checkedGetToken = async (
  gateway: GatewayTs,
  ownerAddress: string,
  gatekeeperNetwork: number,
): Promise<TokenData> => {
  const token = await gateway.getToken(ownerAddress, BigInt(gatekeeperNetwork))
  if (!token) throw new Error('Token not found')
  return token
}
