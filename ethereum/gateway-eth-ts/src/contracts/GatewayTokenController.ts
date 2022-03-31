/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable max-params */

import { Contract, Signer } from "ethers";
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
  ): Promise<unknown> => {
    return this.contract.transferAdmin(newAdmin, txParams) as unknown;
  };

  setFlagsStorage = async (
    flagsStorage: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.setFlagsStorage(flagsStorage, txParams) as unknown;
  };

  acceptTransfersBatch = async (
    tokens: string[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.acceptTransfersBatch(tokens, txParams) as unknown;
  };

  restrictTransfersBatch = async (
    tokens: string[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.restrictTransfersBatch(tokens, txParams) as unknown;
  };

  blacklist = async (user: string, txParams?: TxBase): Promise<unknown> => {
    return this.contract.blacklist(user, txParams) as unknown;
  };

  blacklistBatch = async (
    users: string[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.blacklistBatch(users, txParams) as unknown;
  };

  isBlacklisted = async (user: string): Promise<unknown> => {
    return this.contract.isBlacklisted(user) as unknown;
  };

  createGatekeeperNetwork = async (
    name: string,
    symbol: string,
    isDAOGoverned: boolean,
    daoManager: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.createGatekeeperNetwork(
      name,
      symbol,
      isDAOGoverned,
      daoManager,
      txParams
    ) as unknown;
  };

  addNetworkAuthorities = async (
    token: string,
    authorities: string[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.addNetworkAuthorities(
      token,
      authorities,
      txParams
    ) as unknown;
  };

  removeNetworkAuthorities = async (
    token: string,
    authorities: string[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeNetworkAuthorities(
      token,
      authorities,
      txParams
    ) as unknown;
  };
}
