import { BigNumber, BytesLike, Contract, ContractTransaction, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { TxBase } from "../utils/tx";
import { FlagsStorage as FlagStorageContract } from "./../lib/gen/FlagsStorage";

export class FlagsStorage {
  contract: FlagStorageContract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.FlagsStorage,
      signerOrProvider
    ) as unknown as FlagStorageContract;
  }

  addFlag = async (
    flag: BytesLike,
    index: number | BigNumber,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return await this.contract.addFlag(flag, index, txParams);
  };

  addFlags = async (
    flags: BytesLike[],
    indexes: number[] | BigNumber[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return await this.contract.addFlags(flags, indexes, txParams) as unknown;
  };

  getDAOControllerAddress = async (): Promise<unknown> => {
    return await this.contract.daoController() as unknown;
  };

  getFlagIndex = async (flag: BytesLike): Promise<BigNumber> => {
    return await this.contract.flagIndexes(flag) as BigNumber;
  };

  isFlagSupported = async (flag: BytesLike): Promise<boolean> => {
    return await this.contract.isFlagSupported(flag) as boolean;
  };

  isFlagsSupported = async (flags: BytesLike[]): Promise<boolean[]> => {
    return await this.contract.isFlagsSupported(flags) as Array<boolean>;
  };

  removeFlag = async (flag: BytesLike, txParams?: TxBase): Promise<unknown> => {
    return await this.contract.removeFlag(flag, txParams) as unknown;
  };

  removeFlags = async (
    flags: BytesLike[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return await this.contract.removeFlags(flags, txParams) as unknown;
  };

  getSupportedBitmask = async (): Promise<BigNumber> => {
    return await this.contract.supportedFlagsMask() as BigNumber;
  };

  getUnsupportedBitmask = async (): Promise<BigNumber> => {
    return await this.contract.unsupportedFlagsMask() as BigNumber;
  };

  updateDAOManager = async (daoController: string): Promise<unknown> => {
    return await this.contract.updateDAOManager(daoController) as unknown;
  };
}
