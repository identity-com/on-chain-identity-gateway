import { AccountInfo, PublicKey } from "@solana/web3.js";

export type GatekeeperRecord = {
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

export type GatekeeperClientConfig = {
  baseUrl: string;
  headers?: Record<string, string>;
};

export type TokenCreationRequest = {
  walletPublicKey?: PublicKey;
  selfDeclarationTextAgreedTo?: string;
  presentationRequestId?: string;
};

export type ServerTokenRequest = {
  scopeRequest?: string;
  address?: string;
  selfDeclarationTextAgreedTo?: string;
};

export interface GatekeeperClientInterface {
  createGatewayToken(
    tokenCreationRequest: ServerTokenRequest
  ): Promise<GatekeeperRecord>;
  auditGatewayToken(token: string): Promise<GatekeeperRecord | null>;
  requestAirdrop(walletPublicKey: PublicKey): Promise<void>;
}

export type AirdropRequest = {
  address: string;
};
export type GatekeeperRequest = ServerTokenRequest | AirdropRequest;
export type GatekeeperResponse =
  | GatekeeperRecord
  | null
  | Record<string, unknown>;
