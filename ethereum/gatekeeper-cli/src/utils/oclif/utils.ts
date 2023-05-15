import {Provider} from '@ethersproject/providers'
import {getSigner} from './signer'
import {GatewayTs, TokenData} from '@identity.com/gateway-eth-ts'
import {BigNumber} from '@ethersproject/bignumber'
import {estimateGasPrice, GasPriceKey} from './gas'
export const makeGatewayTs = async ({
  provider,
  privateKey,
  gatewayTokenAddress,
  fees,
  gasLimit,
}: { provider: Provider, privateKey?: string, gatewayTokenAddress: string, fees?: GasPriceKey, gasLimit?: BigNumber }):Promise<GatewayTs> => {
  const signer = privateKey ? getSigner(privateKey, provider) : undefined
  const feeAmount = await estimateGasPrice(provider, fees)
  return new GatewayTs(signer || provider, gatewayTokenAddress, {...feeAmount, gasLimit})
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
