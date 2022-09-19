import {PublicKey, Transaction} from '@solana/web3.js';
import {BN} from "@project-serum/anchor";

export interface Wallet {
    signTransaction(tx: Transaction): Promise<Transaction>;

    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;

    publicKey: PublicKey;
}

export type FeeStructure = {
    token: PublicKey;
    issue: number;
    refresh: number;
    expire: number;
    verify: number;
};

export type UpdateFeeStructure = {
    add: FeeStructure[];
    remove: PublicKey[];
};

export type UpdateAuthKeytructure = {
    add: AuthKeyStructure[];
    remove: PublicKey[];
};

export type AuthKeyStructure = {
    flags: number;
    key: PublicKey;
};

export type CreateNetworkData = {
    authThreshold: number;
    passExpireTime: number;
    signerBump: number;
    fees: FeeStructure[];
    authKeys: AuthKeyStructure[];
};

export type UpdateNetworkData = {
    authThreshold: number;
    passExpireTime: number;
    fees: UpdateFeeStructure;
    authKeys: UpdateAuthKeytructure;
};
export type NetworkAccount = {
    version: number;
    initialAuthority: PublicKey;
    authThreshold: number;
    passExpireTime: number;
    fees: FeeStructure[];
    authKeys: AuthKeyStructure[];
};

// export type PassAccount = {
//     version: number;
//     initialAuthority: PublicKey;
//     issueTime: number;
//     signerBump: number;
//     network: PublicKey;
//     // state: AuthKeyStructure[];
// };

export type RawPassAccount = {
    version: number;
    issueTime: BN;
    initialAuthority: PublicKey;
    signerBump: number;
    network: PublicKey;
    state: {
      active?: {},
      revoked?: {},
      frozen?: {},
    };
}
