import { AccountInfo, PublicKey } from "@solana/web3.js";
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
    readonly issuingGatekeeper: PublicKey,
    readonly gatekeeperNetwork: PublicKey,
    readonly owner: PublicKey,
    public state: State,
    readonly publicKey: PublicKey,
    readonly programId: PublicKey,
    public expiryTime?: number
  ) {}

  isValid(): boolean {
    return this.state === State.ACTIVE && !this.hasExpired();
  }

  private hasExpired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    return !!this.expiryTime && now > this.expiryTime;
  }

  static fromAccount(
    accountInfo: AccountInfo<Buffer>,
    key: PublicKey
  ): GatewayToken {
    const parsedData = GatewayTokenData.fromAccount(accountInfo.data);
    return dataToGatewayToken(parsedData, key);
  }

  public update({
    state,
    expiryTime,
  }: {
    state: State;
    expiryTime?: number;
  }): GatewayToken {
    if (state) this.state = state;
    if (expiryTime) this.expiryTime = expiryTime;
    return this;
  }
}

export type ProgramAccountResponse = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};
