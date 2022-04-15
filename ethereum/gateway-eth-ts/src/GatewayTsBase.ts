import { addresses, ContractAddresses } from "./lib/addresses";
import { gatewayTokenAddresses } from "./lib/gatewaytokens";
import { BigNumber, Signer } from "ethers";
import { getDefaultProvider, Network, Provider } from "@ethersproject/providers";

import { NETWORKS, onGatewayTokenChange, removeGatewayTokenChangeListener } from "./utils";
import { GatewayTokenItems } from "./utils/addresses";
import {
  FlagsStorage,
  GatewayToken,
  GatewayTokenController,
} from "./contracts";
import { checkTokenState, parseTokenState } from "./utils/token-state";
import { TokenData } from "./utils/types";
import { generateId } from "./utils/tokenId";
import { toBytes32 } from "./utils/string";
import { Forwarder } from "./contracts/Forwarder";
import { ZERO_BN } from "./utils/constants";

export class GatewayTsBase {
  providerOrSigner: Provider | Signer;

  networkId: number;

  defaultGas: number;

  defaultGasPrice: number;

  network: string;

  gatewayTokenAddresses: string[];

  contractAddresses: ContractAddresses;

  gatewayTokenController: GatewayTokenController;

  flagsStorage: FlagsStorage;

  gatewayTokens: GatewayTokenItems = {};

  defaultGatewayToken: string | undefined;

  forwarder: Forwarder;

  constructor(
    providerOrSigner: Provider | Signer,
    network: Network,
    defaultGatewayToken?: string,
    options?: { defaultGas?: number; defaultGasPrice?: number }
  ) {
    this.defaultGas = options?.defaultGas || 6_000_000;
    this.defaultGasPrice = options?.defaultGasPrice || 1_000_000_000_000;

    this.providerOrSigner = providerOrSigner || getDefaultProvider();

    this.networkId = network.chainId;
    this.network = NETWORKS[this.networkId];
    this.contractAddresses = addresses[this.networkId];
    this.forwarder = new Forwarder(
      this.providerOrSigner,
      addresses[this.networkId].forwarder
    );

    this.gatewayTokenController = new GatewayTokenController(
      this.providerOrSigner,
      addresses[this.networkId].gatewayTokenController
    );
    this.flagsStorage = new FlagsStorage(
      this.providerOrSigner,
      addresses[this.networkId].flagsStorage
    );
    for (const gatewayToken of gatewayTokenAddresses[this.networkId]) {
      const tokenAddress: string = gatewayToken.address;
      if (
        defaultGatewayToken !== undefined &&
        tokenAddress === defaultGatewayToken
      ) {
        this.defaultGatewayToken = defaultGatewayToken;
      }

      this.gatewayTokens[tokenAddress] = {
        name: gatewayToken.name,
        symbol: gatewayToken.symbol,
        address: gatewayToken.address,
        tokenInstance: new GatewayToken(
          this.providerOrSigner,
          gatewayToken.address
        ),
      };
    }
  }

  getGatewayTokenContract(gatewayTokenAddress?: string): GatewayToken {
    let gatewayToken: GatewayToken;

    if (gatewayTokenAddress) {
      gatewayToken = this.gatewayTokens[gatewayTokenAddress].tokenInstance;

      if (gatewayToken === null) {
        gatewayToken = this.defaultGatewayTokenContract();
      }
    } else {
      gatewayToken = this.defaultGatewayTokenContract();
    }

    return gatewayToken;
  }

  defaultGatewayTokenContract(): GatewayToken {
    if (this.defaultGatewayToken) {
      return this.gatewayTokens[this.defaultGatewayToken].tokenInstance;
    }

    const addr = gatewayTokenAddresses[this.networkId][0].address;
    return this.gatewayTokens[addr].tokenInstance;
  }

  async verify(
    owner: string,
    tokenId?: number,
    gatewayTokenAddress?: string
  ): Promise<boolean> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    const result = (await (tokenId
      ? gatewayToken.verifyTokenByTokenID(owner, tokenId)
      : gatewayToken.verifyToken(owner))) as unknown as boolean[];

    // TODO: Not sure why boolean is wrapped in an array here.
    return result[0];
  }

  async getTokenBalance(
    owner: string,
    gatewayTokenAddress?: string
  ): Promise<BigNumber> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    const balance: number | BigNumber = await gatewayToken.getBalance(owner);

    return BigNumber.from(balance);
  }

  async generateTokenId(
    address: string,
    constrains?: BigNumber,
    gatewayToken?: GatewayToken
  ): Promise<BigNumber> {
    constrains = constrains || ZERO_BN;
    if (constrains.eq(ZERO_BN)) {
      if (gatewayToken === undefined) {
        gatewayToken = this.getGatewayTokenContract(this.defaultGatewayToken);
      }

      const balance = await gatewayToken.getBalance(address);

      constrains = balance.add(BigNumber.from("1"));
    }

    return generateId(address, constrains);
  }

  async getDefaultTokenId(
    owner: string,
    gatewayTokenAddress?: string
  ): Promise<BigNumber> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    return gatewayToken.getTokenId(owner);
  }

  async getTokenState(
    tokenId?: number | BigNumber,
    gatewayTokenAddress?: string
  ): Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    const state: number = await gatewayToken.getTokenState(tokenId);

    return checkTokenState(state);
  }

  async getTokenData(
    tokenId?: number | BigNumber,
    parsed?: boolean,
    gatewayTokenAddress?: string
  ): Promise<TokenData> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    const tokenData: TokenData = await gatewayToken.getToken(tokenId);

    if (parsed) {
      return parseTokenState(tokenData);
    }

    return tokenData;
  }

  async getTokenBitmask(
    tokenId?: number | BigNumber,
    gatewayTokenAddress?: string
  ): Promise<number | BigNumber> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    return gatewayToken.getTokenBitmask(tokenId);
  }

  async getFlagIndex(flag: string): Promise<number | BigNumber> {
    const bytes32 = toBytes32(flag);

    return this.flagsStorage.getFlagIndex(bytes32);
  }

  async subscribeOnGatewayTokenChange(
    tokenId: BigNumber | string,
    callback: (gatewayToken: TokenData) => void,
    gatewayTokenAddress?: string,
  ): Promise<ReturnType<typeof setInterval>> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    let provider: Provider;

    if (Signer.isSigner(this.providerOrSigner)) {
      provider = this.providerOrSigner.provider;
    } else if (Provider.isProvider(this.providerOrSigner)) {
      provider = this.providerOrSigner;
    }

    return onGatewayTokenChange(
      provider,
      tokenId,
      gatewayToken,
      callback
    );
  }

  unsubscribeOnGatewayTokenChange(listenerId: number): void {
    return removeGatewayTokenChangeListener(listenerId);
  }
}
