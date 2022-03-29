import { BigNumber, BytesLike, Contract, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { TxBase } from "../utils/tx";

export class FlagsStorage {
  contract: Contract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.FlagsStorage,
      signerOrProvider
    );
  }

  addFlag = async (
    flag: BytesLike,
    index: number | BigNumber,
    txParams?: TxBase
  ): Promise<any> => {
    return this.contract.addFlag(flag, index, txParams);
  };

  addFlags = async (
    flags: BytesLike[],
    indexes: number[] | BigNumber[],
    txParams?: TxBase
  ): Promise<any> => {
    return this.contract.addFlags(flags, indexes, txParams);
  };

  getDAOControllerAddress = async (): Promise<any> => {
    return this.contract.daoController();
  };

  getFlagIndex = async (flag: BytesLike): Promise<BigNumber> => {
    return this.contract.flagIndexes(flag);
  };

  isFlagSupported = async (flag: BytesLike): Promise<boolean> => {
    return this.contract.isFlagSupported(flag);
  };

  isFlagsSupported = async (flags: BytesLike[]): Promise<boolean[]> => {
    return this.contract.isFlagsSupported(flags);
  };

  removeFlag = async (flag: BytesLike, txParams?: TxBase): Promise<any> => {
    return this.contract.removeFlag(flag, txParams);
  };

  removeFlags = async (flags: BytesLike[], txParams?: TxBase): Promise<any> => {
    return this.contract.removeFlags(flags, txParams);
  };

  getSupportedBitmask = async (): Promise<BigNumber> => {
    return this.contract.supportedFlagsMask();
  };

  getUnsupportedBitmask = async (): Promise<BigNumber> => {
    return this.contract.unsupportedFlagsMask();
  };

  updateDAOManager = async (daoController: string): Promise<any> => {
    return this.contract.updateDAOManager(daoController);
  };
}
