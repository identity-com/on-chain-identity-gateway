import fs from "fs";
import { CLPublicKey, Keys } from "casper-js-sdk";
import {
  MINT_PAYMENT_AMOUNT,
  UPDATE_PAYMENT_AMOUNT,
  WHITELIST_PAYMENT_AMOUNT,
} from "./constants";

export const readConfig = (config?: string): CommandConfig => {
  const content = fs.readFileSync(config ?? "./config.json").toString();
  const json = JSON.parse(content);
  return new CommandConfig(
    Keys.Ed25519.parseKeyFiles(json["publicKey"], json["privateKey"]),
    json["networkKey"],
    json["nodeAddress"],
    json["chain"],
    json["contractHash"],
    json["mintPaymentAmount"],
    json["updatePaymentAmount"],
    json["whitelistPaymentAmount"]
  );
};

export class CommandConfig {
  constructor(
    readonly masterKey: Keys.AsymmetricKey,
    readonly networkKey: string,
    readonly nodeAddress: string[],
    readonly chain: string,
    readonly contractHash: string,
    readonly mintPaymentAmount = MINT_PAYMENT_AMOUNT,
    readonly updatePaymentAmount = UPDATE_PAYMENT_AMOUNT,
    readonly whitelistPaymentAmount = WHITELIST_PAYMENT_AMOUNT
  ) {}
}
