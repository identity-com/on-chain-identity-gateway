import { PublicKey } from "@solana/web3.js";
import { SignCallback } from "../lib/gatewayHttpClient";

export enum State {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  FROZEN = "FROZEN",
}

export type GatekeeperRecord = {
  timestamp: string;
  token: string;
  name: string;
  ipAddress: string;
  country: string;
  state: State;
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
  expiry?: number;
};

export type GatekeeperClientConfig = {
  baseUrl: string;
  headers?: Record<string, string>;
};

export type RequestTokenRequest = {
  walletPublicKey: PublicKey;
  selfDeclarationTextAgreedTo?: string;
  presentationRequestId?: string;
  signer: SignCallback;
};

export type RefreshTokenRequest = {
  token: PublicKey;
  wallet: PublicKey;
  signer: SignCallback;
};

export interface GatekeeperClientInterface {
  requestGatewayToken(request: RequestTokenRequest): Promise<GatekeeperRecord>;
  refreshGatewayToken(request: RefreshTokenRequest): Promise<void>;
  requestAirdrop(walletPublicKey: PublicKey): Promise<void>;
}

// Gatekeeper I/O objects
export type AirdropRequestBody = {
  address: string;
};
export type RefreshTokenRequestBody = {
  proof: string;
};
export type RequestTokenRequestBody = {
  scopeRequest?: string;
  address?: string;
  selfDeclarationTextAgreedTo?: string;
  proof: string;
};
export type GatekeeperRequestBody =
  | RequestTokenRequestBody
  | AirdropRequestBody
  | RefreshTokenRequestBody;
export type GatekeeperResponse =
  | GatekeeperRecord
  | null
  | Record<string, unknown>;
