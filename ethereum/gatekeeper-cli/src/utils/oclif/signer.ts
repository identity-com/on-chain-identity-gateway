import * as fs from 'node:fs'
import {Provider} from '@ethersproject/providers'
import {Wallet} from '@ethersproject/wallet'
import {isValidMnemonic} from '@ethersproject/hdnode'

export const privateKeySigner = function (
  privateKey: string,
  provider: Provider,
): Wallet {
  return new Wallet(privateKey, provider)
}

export const readPrivateKey = (
  file: string,
  provider: Provider,
): Wallet => {
  const privateKey = JSON.parse(
    fs.readFileSync(file).toString('utf-8'),
  ) as string
  return privateKeySigner(privateKey, provider)
}

export const mnemonicSigner = function (
  mnemonic: string,
  provider: Provider,
): Wallet {
  const signer = Wallet.fromMnemonic(mnemonic)

  return signer.connect(provider)
}

export const getSigner = (privateKey: string, provider : Provider):Wallet => {
  return isValidMnemonic(privateKey) ?
    mnemonicSigner(privateKey, provider) :
    privateKeySigner(privateKey, provider)
}
