import { Connection, PublicKey } from '@solana/web3.js';
export declare const TOKEN_PROGRAM_ID: PublicKey;
export declare type GatekeeperRecord = {
    timestamp: string;
    token: string;
    name: string;
    ipAddress: string;
    country: string;
    approved: boolean;
    selfDeclarationTextAgreedTo: string;
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
    headers?: Record<string, string>;
};
export declare type TokenCreationRequest = {
    walletPublicKey?: PublicKey;
    selfDeclarationTextAgreedTo?: string;
    presentationRequestId?: string;
};
declare type ServerTokenRequest = {
    scopeRequest?: string;
    address?: string;
    selfDeclarationTextAgreedTo?: string;
};
export interface GatekeeperClientInterface {
    createGatewayToken(tokenCreationRequest: ServerTokenRequest): Promise<GatekeeperRecord>;
    auditGatewayToken(token: string): Promise<GatekeeperRecord | null>;
    requestAirdrop(walletPublicKey: PublicKey): Promise<void>;
}
export declare type AirdropRequest = {
    address: string;
};
export declare type GatekeeperRequest = ServerTokenRequest | AirdropRequest;
export declare type GatekeeperResponse = GatekeeperRecord | null | Record<string, unknown>;
export declare class GatekeeperClient implements GatekeeperClientInterface {
    config: GatekeeperClientConfig;
    constructor(config: GatekeeperClientConfig);
    get baseUrl(): string;
    get headers(): Record<string, string>;
    postGatekeeperServer<T extends GatekeeperRequest, U extends GatekeeperResponse>(body: T, path?: string): Promise<U>;
    /**
     * This function creates gateway tokens for current connected wallet
     * If called and a gateway token already exists for this wallet, it will throw an exception
     *
     * @param {PublicKey} walletPublicKey
     * @param {string} [selfDeclarationTextAgreedTo] - the text that a user had to agree to in order to call createGatewayToken
     * @param {string} [presentationRequestId] If a Civic scope request was used to verify the identity of the trader, pass it here.
     */
    createGatewayToken({ walletPublicKey, selfDeclarationTextAgreedTo, presentationRequestId }: TokenCreationRequest): Promise<GatekeeperRecord>;
    auditGatewayToken(token: string): Promise<GatekeeperRecord | null>;
    requestAirdrop(walletPublicKey: PublicKey): Promise<void>;
}
export declare type GatewayToken = {
    gatekeeperKey: PublicKey;
    owner: PublicKey;
    isValid: boolean;
    publicKey: PublicKey;
    programId: PublicKey;
};
export declare const findGatewayTokens: (connection: Connection, owner: PublicKey, gatekeeperKey: PublicKey, showRevoked?: boolean) => Promise<GatewayToken[]>;
export {};
