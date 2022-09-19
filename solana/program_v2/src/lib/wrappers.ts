import {RawPassAccount} from "./types";
import {PublicKey} from "@solana/web3.js";
import {EnumMapper} from "./utils";

export enum PassState {
    Active,
    Frozen,
    Revoked,
}

export const PassStateMapping = {
    active: PassState.Active,
    frozen: PassState.Frozen,
    revoked: PassState.Revoked,
}

export class PassAccount {
    private constructor(private _rawAccount: RawPassAccount) {
    }

    static from(rawAccount: RawPassAccount | null): PassAccount | null {
        return rawAccount ? new PassAccount(rawAccount) : null;
    }

    get version(): number {
        return this._rawAccount.version;
    }

    get issueTime(): number {
        return this._rawAccount.issueTime * 1000;
    }

    get bump(): number {
        return this._rawAccount.signerBump;
    }

    get network(): PublicKey {
        return this._rawAccount.network;
    }

    get authority(): PublicKey {
        return this._rawAccount.initialAuthority;
    }

    get state(): PassState {
        return EnumMapper.from(this._rawAccount.state, PassStateMapping);
    }
}