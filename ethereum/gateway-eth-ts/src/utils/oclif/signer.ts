import {Wallet, utils} from "ethers";
import {Provider} from "@ethersproject/providers";
// eslint-disable-next-line unicorn/prefer-node-protocol
import * as fs from "fs";

export const privateKeySigner = function (
  privateKey: string,
  provider: Provider,
): Wallet {
  return new Wallet(privateKey, provider);
};

export const readPrivateKey = (
  file: string,
  provider: Provider,
): Wallet => {
  const privateKey = JSON.parse(
    fs.readFileSync(file).toString("utf-8")
  ) as string;
  return privateKeySigner(privateKey, provider);
};

export const mnemonicSigner = function (
  mnemonic: string,
  provider: Provider,
): Wallet {
  const signer = Wallet.fromMnemonic(mnemonic);

  return signer.connect(provider);
};

export const getSigner = (privateKey: string, provider : Provider):Wallet => {
  return utils.isValidMnemonic(privateKey)
    ? mnemonicSigner(privateKey, provider)
    : privateKeySigner(privateKey, provider);
}