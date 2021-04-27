import { Connection, PublicKey } from '@solana/web3.js';
import axios, { AxiosResponse } from 'axios';

export type GatekeeperRecord = {
  timestamp: string;
  token: string;
  name: string;
  ipAddress: string;
  country: string;
  approved: boolean;
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
}

export interface GatekeeperClientInterface {
  createGatewayToken(walletPublicKey: PublicKey, presentationRequestId?: string):Promise<GatekeeperRecord>;
  auditGatewayToken(token: string): Promise<GatekeeperRecord | null>
}
export type CreateTokenRequest = {
  scopeRequest?: string;
  address?: string;
}
export type AirdropRequest = {
  publicKey: string;
}
export type GatekeeperRequest = CreateTokenRequest | AirdropRequest;
export type GatekeeperResponse = GatekeeperRecord | null | Record<string, unknown>;
const postGatekeeperServer = async <T extends GatekeeperRequest, U extends GatekeeperResponse>(baseUrl: string, body: T, path = ''): Promise<U> => {
  try {
    const postResponse = await axios.post(`${baseUrl}${path}`, body);
    return postResponse.data;
  } catch (error) {
    if (error.response) throw new Error(errorMessageFromResponse(error.response));
    throw error;
  }
};

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

  /**
   * This function creates gateway tokens for current connected wallet
   * If called and a gateway token already exists for this wallet, it will throw an exception
   *
   * @param {PublicKey} walletPublicKey
   * @param {string} [presentationRequestId] If a Civic scope request was used to verify the identity of the trader, pass it here.
   */
  async createGatewayToken(walletPublicKey: PublicKey, presentationRequestId?: string):Promise<GatekeeperRecord> {
    console.log('Creating a new gatekeeper token...');
    const body = presentationRequestId ? { scopeRequest: presentationRequestId } : { address: walletPublicKey.toBase58() };
    return postGatekeeperServer<CreateTokenRequest, GatekeeperRecord>(this.baseUrl, body);
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
    await postGatekeeperServer<AirdropRequest, null>(this.baseUrl, { publicKey: walletPublicKey.toBase58() }, '/airdrop');
  }
}

/**
 * attempts to fetch a gateway token from the Solana blockchain. Will return null if the token account doesn't exist
 * or has been frozen
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} mintAuthorityPublicKey
 * @returns Promise<PublicKey | null>
 */
export const findGatewayToken = async (connection: Connection, owner: PublicKey, mintAuthorityPublicKey: PublicKey): Promise<PublicKey | null> => {
  const accountsResponse = await connection.getParsedTokenAccountsByOwner(
    owner,
    {
      mint: mintAuthorityPublicKey,
    },
  );

  if (!accountsResponse.value) return null;

  const validAccounts = accountsResponse.value.filter(
    (entry) => entry?.account?.data?.parsed?.info?.state !== 'frozen',
  );

  if (!validAccounts.length) return null;

  return validAccounts[0].pubkey;
};
