import { AccountInfo, PublicKey } from "@solana/web3.js";

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
}

export type ProgramAccountResponse = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};
