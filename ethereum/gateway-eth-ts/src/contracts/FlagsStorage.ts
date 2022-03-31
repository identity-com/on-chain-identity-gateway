/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */

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
  ): Promise<unknown> => {
    return this.contract.addFlag(flag, index, txParams) as unknown;
  };

  addFlags = async (
    flags: BytesLike[],
    indexes: number[] | BigNumber[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.addFlags(flags, indexes, txParams) as unknown;
  };

  getDAOControllerAddress = async (): Promise<unknown> => {
    return this.contract.daoController() as unknown;
  };

  getFlagIndex = async (flag: BytesLike): Promise<BigNumber> => {
    return this.contract.flagIndexes(flag) as BigNumber;
  };

  isFlagSupported = async (flag: BytesLike): Promise<boolean> => {
    return this.contract.isFlagSupported(flag) as boolean;
  };

  isFlagsSupported = async (flags: BytesLike[]): Promise<boolean[]> => {
    return this.contract.isFlagsSupported(flags) as Array<boolean>;
  };

  removeFlag = async (flag: BytesLike, txParams?: TxBase): Promise<unknown> => {
    return this.contract.removeFlag(flag, txParams) as unknown;
  };

  removeFlags = async (
    flags: BytesLike[],
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeFlags(flags, txParams) as unknown;
  };

  getSupportedBitmask = async (): Promise<BigNumber> => {
    return this.contract.supportedFlagsMask() as BigNumber;
  };

  getUnsupportedBitmask = async (): Promise<BigNumber> => {
    return this.contract.unsupportedFlagsMask() as BigNumber;
  };

  updateDAOManager = async (daoController: string): Promise<unknown> => {
    return this.contract.updateDAOManager(daoController) as unknown;
  };
}
