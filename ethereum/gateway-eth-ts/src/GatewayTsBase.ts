import { addresses, ContractAddresses } from "./lib/addresses";
import { gatewayTokenAddresses } from "./lib/gatewaytokens";
import { BigNumber, Wallet } from "ethers";
import { BaseProvider } from "@ethersproject/providers";

import { SUBTRACT_GAS_LIMIT, NETWORKS } from "./utils";
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

export class GatewayTsBase {
  provider: BaseProvider;

  networkId: number;

  blockGasLimit: BigNumber;

  defaultGas: number;

  defaultGasPrice: number;

  network: string;

  wallet: Wallet;

  gatewayTokenAddresses: string[];

  contractAddresses: ContractAddresses;

  gatewayTokenController: GatewayTokenController;

  flagsStorage: FlagsStorage;

  gatewayTokens: GatewayTokenItems = {};

  defaultGatewayToken: string | undefined;

  forwarder: Forwarder;

  constructor(
    provider: BaseProvider,
    signer?: Wallet,
    options?: { defaultGas?: number; defaultGasPrice?: number }
  ) {
    this.defaultGas = options?.defaultGas || 6_000_000;
    this.defaultGasPrice = options?.defaultGasPrice || 1_000_000_000_000;

    this.wallet = signer;

    this.provider = provider;
  }

  async init(defaultGatewayToken?: string): Promise<void> {
    const network = await this.provider.getNetwork();

    this.networkId = network.chainId;
    this.network = NETWORKS[this.networkId];
    this.contractAddresses = addresses[this.networkId];
    this.forwarder = new Forwarder(
      this.wallet || this.provider,
      addresses[this.networkId].forwarder
    );

    this.gatewayTokenController = new GatewayTokenController(
      this.wallet || this.provider,
      addresses[this.networkId].gatewayTokenController
    );
    this.flagsStorage = new FlagsStorage(
      this.wallet || this.provider,
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
          this.wallet || this.provider,
          gatewayToken.address
        ),
      };
    }
  }

  async setGasLimit(): Promise<void> {
    const block = await this.provider.getBlock("latest");
    this.blockGasLimit = block.gasLimit.sub(BigNumber.from(SUBTRACT_GAS_LIMIT));
  }

  getGatewayTokenContract(gatewayTokenAddress?: string): GatewayToken {
    let gatewayToken: GatewayToken;

    if (gatewayTokenAddress) {
      gatewayToken = this.gatewayTokens[gatewayTokenAddress]?.tokenInstance;

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
    // eslint-disable-next-line default-param-last
    constrains: BigNumber = BigNumber.from("0"), // TODO: fix linting
    gatewayToken?: GatewayToken
  ): Promise<BigNumber> {
    if (constrains.eq(BigNumber.from("0"))) {
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
}
