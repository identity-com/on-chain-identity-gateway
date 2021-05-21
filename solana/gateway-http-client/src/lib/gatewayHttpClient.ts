import { PublicKey } from "@solana/web3.js";
import axios, { AxiosResponse } from "axios";
import {
  AirdropRequest,
  GatekeeperClientConfig,
  GatekeeperClientInterface,
  GatekeeperRecord,
  GatekeeperRequest,
  GatekeeperResponse,
  ServerTokenRequest,
  TokenCreationRequest,
} from "../types";

const errorMessageFromResponse = (
  response: AxiosResponse
): string | undefined => {
  console.error("errorFromAxiosResponse", response);
  const errorJson = response.data;
  const errorMessage = errorJson.message || response.statusText;
  console.log("errorFromAxiosResponse", { errorJson, errorMessage });
  return errorMessage;
};

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
