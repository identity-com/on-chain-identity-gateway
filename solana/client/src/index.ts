import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import axios, { AxiosResponse } from "axios";
import { PROGRAM_ID } from "../../gatekeeper-lib/src/util/constants";
import { GatewayTokenData } from "./solana/GatewayTokenData";

// Based on solana/integration-lib/src/state.rs
// If the optional the parent-gateway-token field is populated, this value will be
// 34 (2 + 32) instead. TODO IDCOM-320 restructure the gateway token accounts to put
// all optional values at the end of the struct to simplify account parsing a little
const GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET = 2;
// As above, if optional fields are present, this will differ. TODO IDCOM-320 fixes this
const GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET = 35;

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

const errorMessageFromResponse = (
  response: AxiosResponse
): string | undefined => {
  console.error("errorFromAxiosResponse", response);
  const errorJson = response.data;
  const errorMessage = errorJson.message || response.statusText;
  console.log("errorFromAxiosResponse", { errorJson, errorMessage });
  return errorMessage;
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

type ServerTokenRequest = {
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

export class GatekeeperClient implements GatekeeperClientInterface {
  config: GatekeeperClientConfig;
  constructor(config: GatekeeperClientConfig) {
    this.config = config;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get headers(): Record<string, string> {
    return this.config.headers || {};
  }

  async postGatekeeperServer<
    T extends GatekeeperRequest,
    U extends GatekeeperResponse
  >(body: T, path = ""): Promise<U> {
    try {
      const postResponse = await axios.post(
        `${this.baseUrl}${path}`,
        body,
        this.headers ? { headers: this.headers } : {}
      );
      return postResponse.data;
    } catch (error) {
      if (error.response)
        throw new Error(errorMessageFromResponse(error.response));
      throw error;
    }
  }

  /**
   * This function creates gateway tokens for current connected wallet
   * If called and a gateway token already exists for this wallet, it will throw an exception
   *
   * @param {PublicKey} walletPublicKey
   * @param {string} [selfDeclarationTextAgreedTo] - the text that a user had to agree to in order to call createGatewayToken
   * @param {string} [presentationRequestId] If a Civic scope request was used to verify the identity of the trader, pass it here.
   */
  async createGatewayToken({
    walletPublicKey,
    selfDeclarationTextAgreedTo,
    presentationRequestId,
  }: TokenCreationRequest): Promise<GatekeeperRecord> {
    if (!walletPublicKey && !presentationRequestId)
      throw new Error(
        "walletPublicKey or a presentationRequestId must be provided in the token creation request"
      );

    const body = presentationRequestId
      ? { presentationRequestId }
      : { address: walletPublicKey?.toBase58() };
    const gatewayTokenCreationRequest = {
      ...body,
      ...(selfDeclarationTextAgreedTo ? { selfDeclarationTextAgreedTo } : {}),
    };
    console.log(
      "Requesting a new gatekeeper token...",
      gatewayTokenCreationRequest
    );
    return this.postGatekeeperServer<ServerTokenRequest, GatekeeperRecord>(
      gatewayTokenCreationRequest
    );
  }

  async auditGatewayToken(token: string): Promise<GatekeeperRecord | null> {
    try {
      const getResponse = await axios.get(`${this.baseUrl}/${token}`);
      return getResponse.data;
    } catch (error) {
      if (error.response)
        throw new Error(errorMessageFromResponse(error.response));
      throw error;
    }
  }

  async requestAirdrop(walletPublicKey: PublicKey): Promise<void> {
    console.log(`Requesting airdrop to key ${walletPublicKey.toBase58()}...`);
    await this.postGatekeeperServer<AirdropRequest, null>(
      { address: walletPublicKey.toBase58() },
      "/airdrop"
    );
  }
}

export type GatewayToken = {
  //  the key used to reference the issuing gatekeeper
  issuingGatekeeper: PublicKey;
  gatekeeperNetwork: PublicKey;
  owner: PublicKey;
  isValid: boolean;
  publicKey: PublicKey;
  programId: PublicKey;
};

type ProgramAccountResponse = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};

const dataToGatewayToken = (
  data: GatewayTokenData,
  publicKey: PublicKey
): GatewayToken => ({
  // TODO IDCOM-306
  owner: data.owner.toPublicKey(),
  programId: PROGRAM_ID,
  isValid: !!data.state.active, // TODO IDCOM-306
  publicKey,
  issuingGatekeeper: data.issuingGatekeeper.toPublicKey(),
  gatekeeperNetwork: data.gatekeeperNetwork.toPublicKey(), // Temp TODO IDCOM-306
});

export const findGatewayTokens = async (
  connection: Connection,
  owner: PublicKey,
  gatekeeperNetwork: PublicKey,
  showRevoked = false
): Promise<GatewayToken[]> => {
  const ownerFilter = {
    memcmp: {
      offset: GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET,
      bytes: owner.toBase58(),
    },
  };
  const gatekeeperNetworkFilter = {
    memcmp: {
      offset: GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET,
      bytes: gatekeeperNetwork?.toBase58(),
    },
  };
  const filters = [ownerFilter, gatekeeperNetworkFilter];
  const accountsResponse = await connection.getProgramAccounts(PROGRAM_ID, {
    filters,
  });

  if (!accountsResponse) return [];

  const toGatewayToken = ({
    pubkey,
    account,
  }: ProgramAccountResponse): GatewayToken =>
    dataToGatewayToken(GatewayTokenData.fromAccount(account.data), pubkey);

  return accountsResponse
    .map(toGatewayToken)
    .filter((gatewayToken) => gatewayToken.isValid || showRevoked);
};
