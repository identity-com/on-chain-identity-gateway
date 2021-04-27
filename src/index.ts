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

const throwIfErrorResponse = (response: AxiosResponse): void => {
  if (response.status > 299) {
    console.error('throwIfErrorResponse', response);
    const errorJson = response.data;
    const errorMessage = errorJson.message || response.statusText;
    console.log('throwIfErrorResponse', { errorJson, errorMessage });
    throw new Error(errorMessage);
  }
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
  const postResponse = await axios.post(`${baseUrl}${path}`, body);
  await throwIfErrorResponse(postResponse);
  return postResponse.data;
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
    console.log('Creating a new gatekeeper token');
    const body = presentationRequestId ? { scopeRequest: presentationRequestId } : { address: walletPublicKey.toBase58() };
    return postGatekeeperServer<CreateTokenRequest, GatekeeperRecord>(this.baseUrl, body);
  }

  async auditGatewayToken(token: string): Promise<GatekeeperRecord | null> {
    const getResponse = await axios.get(`${this.baseUrl}/${token}`);
    await throwIfErrorResponse(getResponse);
    return getResponse.data;
  }

  async requestAirdrop(walletPublicKey: PublicKey): Promise<void> {
    console.log(`Requesting airdrop to key ${walletPublicKey.toBase58()}`);
    await postGatekeeperServer<AirdropRequest, null>(this.baseUrl, { publicKey: walletPublicKey.toBase58() }, '/airdrop');
  }
}

/**
 * attempts to fetch a gateway token from the Solana blockchain. Will return null if the token account doesn't exist
 * or has been frozen
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} gatekeeperKey
 * @returns Promise<PublicKey | null>
 */
export const findGatewayToken = async (connection: Connection, owner: PublicKey, gatekeeperKey: PublicKey): Promise<PublicKey | null> => {
  const accountsResponse = await connection.getParsedTokenAccountsByOwner(
    owner,
    {
      mint: gatekeeperKey,
    },
  );

  if (!accountsResponse.value) return null;

  const validAccounts = accountsResponse.value.filter(
    (entry) => entry?.account?.data?.parsed?.info?.state !== 'frozen',
  );

  if (!validAccounts.length) return null;

  return validAccounts[0].pubkey;
};
