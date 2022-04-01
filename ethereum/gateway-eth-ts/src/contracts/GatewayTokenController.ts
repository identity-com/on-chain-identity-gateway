/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Contract, ContractTransaction, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { TxBase } from "../utils/tx";

export class GatewayTokenController {
  contract: Contract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.GatewayTokenController,
      signerOrProvider
    );
  }

  transferAdmin = async (
    newAdmin: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.transferAdmin(newAdmin, txParams) as Promise<ContractTransaction>;
  };

  acceptTransfersBatch = async (
    tokens: string[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.acceptTransfersBatch(tokens, txParams) as Promise<ContractTransaction>;
  };

  restrictTransfersBatch = async (
    tokens: string[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.restrictTransfersBatch(tokens, txParams) as Promise<ContractTransaction>;
  };

  blacklist = async (user: string, txParams?: TxBase): Promise<ContractTransaction> => {
    return this.contract.blacklist(user, txParams) as Promise<ContractTransaction>;
  };

  blacklistBatch = async (
    users: string[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.blacklistBatch(users, txParams) as Promise<ContractTransaction>;
  };

  isBlacklisted = async (user: string): Promise<boolean> => {
    return this.contract.isBlacklisted(user) as Promise<boolean>;
  };

  /* eslint-disable max-params */
  createGatekeeperNetwork = async (
    name: string,
    symbol: string,
    isDAOGoverned: boolean,
    daoManager: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.createGatekeeperNetwork(
      name,
      symbol,
      isDAOGoverned,
      daoManager,
      txParams
    ) as Promise<ContractTransaction>;
  };

  addNetworkAuthorities = async (
    token: string,
    authorities: string[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.addNetworkAuthorities(
      token,
      authorities,
      txParams
    ) as Promise<ContractTransaction>;
  };

  removeNetworkAuthorities = async (
    token: string,
    authorities: string[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeNetworkAuthorities(
      token,
      authorities,
      txParams
    ) as Promise<ContractTransaction>;
  };
}
