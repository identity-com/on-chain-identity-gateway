import {getSigner} from './signer'
import {GatewayTs, TokenData} from '@identity.com/gateway-eth-ts'
import {estimateGasPrice} from './gas'
import {ParsedFlags} from './flags'
export const makeGatewayTs = async ({
  provider,
  privateKey,
  gatewayTokenAddress,
  fees,
  gasLimit,
  readOnly = false,
}: ParsedFlags):Promise<GatewayTs> => {
  const signer = privateKey ? getSigner(privateKey, provider) : undefined
  const feeAmount = readOnly ? {} : await estimateGasPrice(provider, fees)
  const providerOrWallet = readOnly ? provider : signer || provider
  return new GatewayTs(providerOrWallet, gatewayTokenAddress, {...feeAmount, gasLimit})
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
