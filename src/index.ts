import { AccountInfo, Connection, ParsedAccountData, PublicKey, RpcResponseAndContext } from '@solana/web3.js';
import axios, { AxiosResponse } from 'axios';

export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);
export type GatekeeperRecord = {
  timestamp: string;
  token: string;
  name: string;
  ipAddress: string;
  country: string;
  approved: boolean;
  selfDeclarationTextAgreedTo: string;
  document?: {
    nationality: string,
    name: {
      familyNames: string,
      givenNames: string
    },
    dateOfBirth: {
      day: number,
      month: number,
      year: number
    }
  },
}

const errorMessageFromResponse = (response: AxiosResponse): string | undefined => {
  console.error('errorFromAxiosResponse', response);
  const errorJson = response.data;
  const errorMessage = errorJson.message || response.statusText;
  console.log('errorFromAxiosResponse', { errorJson, errorMessage });
  return errorMessage;
};

export type GatekeeperClientConfig = {
  baseUrl: string;
  headers?: Record<string, string>
}

export type TokenCreationRequest = {
  walletPublicKey?: PublicKey;
  selfDeclarationTextAgreedTo?: string;
  presentationRequestId?: string;
}

type ServerTokenRequest = {
  scopeRequest?: string;
  address?: string;
  selfDeclarationTextAgreedTo?: string;
}
export interface GatekeeperClientInterface {
  createGatewayToken(tokenCreationRequest: ServerTokenRequest):Promise<GatekeeperRecord>;
  auditGatewayToken(token: string): Promise<GatekeeperRecord | null>;
  requestAirdrop(walletPublicKey: PublicKey): Promise<void>;
}

export type AirdropRequest = {
  address: string;
}
export type GatekeeperRequest = ServerTokenRequest | AirdropRequest;
export type GatekeeperResponse = GatekeeperRecord | null | Record<string, unknown>;

export class GatekeeperClient implements GatekeeperClientInterface {
  config: GatekeeperClientConfig;
  constructor(config: GatekeeperClientConfig) {
    if (!config) {
      throw new Error('No valid config provided');
    }
    this.config = config;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get headers(): Record<string, string> {
    return this.config.headers || {};
  }

  async postGatekeeperServer<T extends GatekeeperRequest, U extends GatekeeperResponse>(body: T, path = ''): Promise<U> {
    try {
      const postResponse = await axios.post(`${this.baseUrl}${path}`, body, this.headers ? { headers: this.headers } : {});
      return postResponse.data;
    } catch (error) {
      if (error.response) throw new Error(errorMessageFromResponse(error.response));
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
  async createGatewayToken({ walletPublicKey, selfDeclarationTextAgreedTo, presentationRequestId }: TokenCreationRequest):Promise<GatekeeperRecord> {
    if (!walletPublicKey && !presentationRequestId) throw new Error('walletPublicKey or a presentationRequestId must be provided in the token creation request');

    const body = presentationRequestId
      ? { presentationRequestId }
      : { address: walletPublicKey?.toBase58() };
    const gatewayTokenCreationRequest = {
      ...body,
      ...(selfDeclarationTextAgreedTo ? { selfDeclarationTextAgreedTo } : {}),
    };
    console.log('Requesting a new gatekeeper token...', gatewayTokenCreationRequest);
    return this.postGatekeeperServer<ServerTokenRequest, GatekeeperRecord>(gatewayTokenCreationRequest);
  }

  async auditGatewayToken(token: string): Promise<GatekeeperRecord | null> {
    try {
      const getResponse = await axios.get(`${this.baseUrl}/${token}`);
      return getResponse.data;
    } catch (error) {
      if (error.response) throw new Error(errorMessageFromResponse(error.response));
      throw error;
    }
  }

  async requestAirdrop(walletPublicKey: PublicKey): Promise<void> {
    console.log(`Requesting airdrop to key ${walletPublicKey.toBase58()}...`);
    await this.postGatekeeperServer<AirdropRequest, null>({ address: walletPublicKey.toBase58() }, '/airdrop');
  }
}

export type GatewayToken = {
  //  the key used to reference the gatekeeper
  // note - this is not necessarily the publicKey of the gatekeeper themselves
  // While spl-token is used as the gateway token program, this is the gatekeeper mint
  gatekeeperKey: PublicKey;
  // governanceKey: PublicKey TODO
  owner: PublicKey;
  isValid: boolean;
  publicKey: PublicKey;
  programId: PublicKey;
};

export const findGatewayTokens = async (
  connection: Connection,
  owner: PublicKey,
  gatekeeperKey: PublicKey,
  showRevoked = false,
): Promise<GatewayToken[]> => {
  const accountsResponse: RpcResponseAndContext<
    Array<{
      pubkey: PublicKey;
      account: AccountInfo<ParsedAccountData>;
    }>
  > = await connection.getParsedTokenAccountsByOwner(
    owner,
    {
      mint: gatekeeperKey,
    },
  );

  if (!accountsResponse.value) return [];

  const toGatewayToken = (entry: { pubkey: PublicKey, account: AccountInfo<ParsedAccountData> }) => ({
    programId: TOKEN_PROGRAM_ID,
    publicKey: entry.pubkey,
    owner,
    gatekeeperKey: gatekeeperKey,
    isValid: entry.account?.data?.parsed?.info?.state !== 'frozen',
  });

  return accountsResponse.value
    .map(toGatewayToken)
    .filter((gatewayToken) => gatewayToken.isValid || showRevoked);
};
