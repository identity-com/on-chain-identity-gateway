import {
  CLPublicKey,
  CLAccountHash,
} from "casper-js-sdk";
import { GatewayTokenData } from "../lib/GatewayTokenData";
import { PROGRAM_ID } from "../lib/constants";
import { dataToGatewayToken } from "../lib/util";

export enum State {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  FROZEN = "FROZEN",
}
export class GatewayToken {
  constructor(
    //  the key used to reference the issuing gatekeeper
    readonly issuingGatekeeper: CLPublicKey,
    readonly gatekeeperNetwork: CLPublicKey,
    readonly owner: CLPublicKey,
    readonly state: State,
    readonly publicKey: CLPublicKey,
    readonly programId: CLPublicKey,
    readonly expiryTime?: number
  ) {}

  isValid(): boolean {
    return this.state === State.ACTIVE && !this.hasExpired();
  }

  private hasExpired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    return !!this.expiryTime && now > this.expiryTime;
  }

  // TODO: Check with Civic - what this is
  static fromAccount(
    accountInfo: AccountInfo<Buffer>,
    key: CLPublicKey
  ): GatewayToken {
    const parsedData = GatewayTokenData.fromAccount(accountInfo.data);
    return dataToGatewayToken(parsedData, key);
  }
}

export type ProgramAccountResponse = {
  pubkey: CLPublicKey;
  account: AccountInfo<Buffer>;
};
