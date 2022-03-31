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

  transferAdmin = async (newAdmin: string, txParams?: TxBase) => {
    return this.contract.transferAdmin(newAdmin, txParams);
  };

  setFlagsStorage = async (flagsStorage: string, txParams?: TxBase) => {
    return this.contract.setFlagsStorage(flagsStorage, txParams);
  };

  acceptTransfersBatch = async (tokens: string[], txParams?: TxBase) => {
    return this.contract.acceptTransfersBatch(tokens, txParams);
  };

  restrictTransfersBatch = async (tokens: string[], txParams?: TxBase) => {
    return this.contract.restrictTransfersBatch(tokens, txParams);
  };

  blacklist = async (user: string, txParams?: TxBase) => {
    return this.contract.blacklist(user, txParams);
  };

  blacklistBatch = async (users: string[], txParams?: TxBase) => {
    return this.contract.blacklistBatch(users, txParams);
  };

  isBlacklisted = async (user: string) => {
    return this.contract.isBlacklisted(user);
  };

  createGatekeeperNetwork = async (
    name: string,
    symbol: string,
    isDAOGoverned: boolean,
    daoManager: string,
    txParams?: TxBase
  ) => {
    return this.contract.createGatekeeperNetwork(
      name,
      symbol,
      isDAOGoverned,
      daoManager,
      txParams
    );
  };

  addNetworkAuthorities = async (
    token: string,
    authorities: string[],
    txParams?: TxBase
  ) => {
    return this.contract.addNetworkAuthorities(token, authorities, txParams);
  };

  removeNetworkAuthorities = async (
    token: string,
    authorities: string[],
    txParams?: TxBase
  ) => {
    return this.contract.removeNetworkAuthorities(token, authorities, txParams);
  };
}
