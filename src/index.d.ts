import { Connection, PublicKey } from '@solana/web3.js';
export declare type GatekeeperRecord = {
    timestamp: string;
    token: string;
    name: string;
    ipAddress: string;
    country: string;
    approved: boolean;
    document?: {
        nationality: string;
        name: {
            familyNames: string;
            givenNames: string;
        };
        dateOfBirth: {
            day: number;
            month: number;
            year: number;
        };
    };
};
export declare type GatekeeperClientConfig = {
    baseUrl: string;
};
export interface GatekeeperClientInterface {
    createGatewayToken(walletPublicKey: PublicKey, scopeRequestId?: string): Promise<GatekeeperRecord>;
    auditGatewayToken(token: string): Promise<GatekeeperRecord | null>;
}
export declare type CreateTokenRequest = {
    scopeRequest?: string;
    address?: string;
};
export declare type AirdropRequest = {
    publicKey: string;
};
export declare type GatekeeperRequest = CreateTokenRequest | AirdropRequest;
export declare type GatekeeperResponse = GatekeeperRecord | null | {};
export declare class GatekeeperClient implements GatekeeperClientInterface {
    config: GatekeeperClientConfig;
    constructor(config: GatekeeperClientConfig);
    get baseUrl(): string;
    /**
     * This function creates gateway tokens for current connected wallet
     * If called and a gateway token already exists for this wallet, it will throw an exception
     *
     * @param {PublicKey} walletPublicKey
     * @param {string} [scopeRequestId] If a Civic scope request was used to verify the identity of the trader, pass it here.
     */
    createGatewayToken(walletPublicKey: PublicKey, scopeRequestId?: string): Promise<GatekeeperRecord>;
    auditGatewayToken(token: string): Promise<GatekeeperRecord | null>;
    requestAirdrop(walletPublicKey: PublicKey): Promise<void>;
}
/**
 * attempts to fetch a gateway token from the Solana blockchain. Will return null if the token account doesn't exist
 * or has been frozen
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} gatekeeperKey
 * @returns Promise<PublicKey | null>
 */
export declare const findGatewayToken: (connection: Connection, owner: PublicKey, gatekeeperKey: PublicKey) => Promise<PublicKey | null>;
