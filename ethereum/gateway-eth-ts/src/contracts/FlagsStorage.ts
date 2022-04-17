/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BigNumber, BytesLike, Contract, ContractTransaction, Overrides, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { TxBase } from "../utils/tx";

export class FlagsStorage {
  contract: Contract;

  constructor(signerOrProvider: Signer | Provider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.FlagsStorage,
      signerOrProvider
    );
  }

  addFlag = async (
    flag: BytesLike,
    index: number | BigNumber,
    txParams?: Overrides
  ): Promise<ContractTransaction> => {
    return this.contract.addFlag(flag, index, txParams) as Promise<ContractTransaction>;
  };

  addFlags = async (
    flags: BytesLike[],
    indexes: number[] | BigNumber[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.addFlags(flags, indexes, txParams) as Promise<ContractTransaction>;
  };

  getDAOControllerAddress = async (): Promise<string> => {
    return this.contract.daoController() as Promise<string>;
  };

  getFlagIndex = async (flag: BytesLike): Promise<number> => {
    return this.contract.flagIndexes(flag) as Promise<number>;
  };

  isFlagSupported = async (flag: BytesLike): Promise<boolean> => {
    return this.contract.isFlagSupported(flag) as Promise<boolean>;
  };

  isFlagsSupported = async (flags: BytesLike[]): Promise<boolean[]> => {
    return this.contract.isFlagsSupported(flags) as Promise<boolean[]>;
  };

  removeFlag = async (flag: BytesLike, txParams?: TxBase): Promise<ContractTransaction> => {
    return this.contract.removeFlag(flag, txParams) as Promise<ContractTransaction>;
  };

  removeFlags = async (
    flags: BytesLike[],
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeFlags(flags, txParams) as Promise<ContractTransaction>;
  };

  getSupportedBitmask = async (): Promise<BigNumber> => {
    return this.contract.supportedFlagsMask() as Promise<BigNumber>;
  };

  getUnsupportedBitmask = async (): Promise<BigNumber> => {
    return this.contract.unsupportedFlagsMask() as Promise<BigNumber>;
  };

  updateDAOManager = async (daoController: string): Promise<ContractTransaction> => {
    return this.contract.updateDAOManager(daoController) as Promise<ContractTransaction>;
  };
}
