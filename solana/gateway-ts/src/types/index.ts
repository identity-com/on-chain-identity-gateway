import { AccountInfo, PublicKey } from "@solana/web3.js";
import { GatewayTokenData } from "../lib/GatewayTokenData";
import { dataToGatewayToken } from "../lib/util";

export declare type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

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
    readonly state: State,
    readonly publicKey: PublicKey,
    readonly programId: PublicKey,
    readonly expiryTime?: number
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
    return new GatewayToken(
      this.issuingGatekeeper,
      this.gatekeeperNetwork,
      this.owner,
      state,
      this.publicKey,
      this.programId,
      expiryTime || this.expiryTime
    );
  }
}

export type ProgramAccountResponse = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};
