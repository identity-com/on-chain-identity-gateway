import { prove } from "@identity.com/prove-solana-wallet";
import { PublicKey, Transaction } from "@solana/web3.js";
import axios, { AxiosResponse, Method } from "axios";
import {
  GatekeeperClientConfig,
  GatekeeperClientInterface,
  GatekeeperRecord,
  GatekeeperResponse,
  RefreshTokenRequest,
  CreateTokenRequest,
  CreateTokenRequestBody,
  AirdropRequestBody,
  RefreshTokenRequestBody,
  GatekeeperRequestBody,
} from "../types";

export declare enum State {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  FROZEN = "FROZEN",
}

export type SignCallback = (transaction: Transaction) => Promise<Transaction>;

const proveWalletOwnership = (key: PublicKey, signCallback: SignCallback) =>
  prove(key, signCallback).then((buffer) => buffer.toString("base64"));

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

  get headers(): Record<string, string> | undefined {
    return this.config.headers;
  }

  async callGatekeeper<
    T extends GatekeeperRequestBody,
    U extends GatekeeperResponse
  >(method: Method, body: T, path = ""): Promise<U> {
    try {
      const respose = await axios.request({
        method,
        url: `${this.baseUrl}${path}`,
        data: body,
        ...(this.headers ? { headers: this.headers } : {}),
      });
      return respose.data;
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
   * @param {SignCallback} signer A signer callback, used to prove ownership of the wallet public key
   */
  async createGatewayToken({
    walletPublicKey,
    selfDeclarationTextAgreedTo,
    presentationRequestId,
    signer,
  }: CreateTokenRequest): Promise<GatekeeperRecord> {
    // produce a signature that proves ownership of a wallet
    const proof = await proveWalletOwnership(walletPublicKey, signer);

    // We only pass the wallet public key as part of the request if
    // it was not passed as part of the presentation.
    const body = presentationRequestId
      ? { presentationRequestId }
      : { address: walletPublicKey.toBase58() };
    const gatewayTokenCreationRequest = {
      ...body,
      proof,
      ...(selfDeclarationTextAgreedTo ? { selfDeclarationTextAgreedTo } : {}),
    };
    console.log(
      "Requesting a new gatekeeper token...",
      gatewayTokenCreationRequest
    );
    return this.callGatekeeper<CreateTokenRequestBody, GatekeeperRecord>(
      "POST",
      gatewayTokenCreationRequest
    );
  }

  /**
   * This function refreshes the token by extending the expiration of the token
   *
   * @param request
   */
  async refreshGatewayToken(request: RefreshTokenRequest): Promise<void> {
    try {
      // produce a signature that proves ownership of a wallet
      const proof = await proveWalletOwnership(request.wallet, request.signer);

      await this.callGatekeeper<RefreshTokenRequestBody, GatekeeperResponse>(
        "PATCH",
        { proof },
        `/${request.token.toBase58()}/refresh`
      );
    } catch (error) {
      if (error.response)
        throw new Error(errorMessageFromResponse(error.response));
      throw error;
    }
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

  async patchTokenState(token: String, state: State): Promise<boolean> {
    console.log(`Patching token state to ${state} : ${token}`);
    try {
      const patchResponse = await axios.patch(`${this.baseUrl}/${token}`, {
        state,
      });
      return patchResponse.status == 200;
    } catch (error) {
      if (error.response)
        throw new Error(errorMessageFromResponse(error.response));
      throw error;
    }
  }

  async freezeGatewayToken(token: string): Promise<boolean> {
    return this.patchTokenState(token, State.FROZEN);
  }

  async unfreezeGatewayToken(token: string): Promise<boolean> {
    return this.patchTokenState(token, State.ACTIVE);
  }

  async revokeGatewayToken(token: string): Promise<boolean> {
    try {
      const deleteResponse = await axios.delete(`${this.baseUrl}/${token}`);
      return deleteResponse.status == 200;
    } catch (error) {
      if (error.response)
        throw new Error(errorMessageFromResponse(error.response));
      throw error;
    }
  }

  async requestAirdrop(walletPublicKey: PublicKey): Promise<void> {
    console.log(`Requesting airdrop to key ${walletPublicKey.toBase58()}...`);
    await this.callGatekeeper<AirdropRequestBody, null>(
      "POST",
      { address: walletPublicKey.toBase58() },
      "/airdrop"
    );
  }
}
