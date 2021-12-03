import { BigNumber, BytesLike, Contract, Signer} from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import abis from "../lib/abis";
import { TxBase } from '../utils/tx';

export class FlagsStorage {
    contract: Contract;

    constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
        this.contract = new Contract(
            addressOrName,
            abis.FlagsStorage,
            signerOrProvider,
          );      
    }

    addFlag = async (flag: BytesLike, index: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.addFlag(flag, index, txParams);
    }

    addFlags = async (flags: BytesLike[], indexes: number[] | BigNumber[], txParams?: TxBase) => {
        return await this.contract.addFlags(flags, indexes, txParams);
    }

    getDAOControllerAddress = async () => {
        return await this.contract.daoController();
    }

    getFlagIndex = async (flag: BytesLike):Promise<BigNumber> => {
        return await this.contract.flagIndexes(flag);
    }

    isFlagSupported = async (flag: BytesLike):Promise<boolean> =>  {
        return await this.contract.isFlagSupported(flag);
    }

    isFlagsSupported = async (flags: BytesLike[]):Promise<boolean[]> => {
        return await this.contract.isFlagsSupported(flags);
    }

    removeFlag = async (flag: BytesLike, txParams?: TxBase) => {
        return await this.contract.removeFlag(flag, txParams);
    }

    removeFlags = async (flags: BytesLike[], txParams?: TxBase) => {
        return await this.contract.removeFlags(flags, txParams);
    }

    getSupportedBitmask = async ():Promise<BigNumber> => {
        return await this.contract.supportedFlagsMask();
    }

    getUnsupportedBitmask = async ():Promise<BigNumber> => {
        return await this.contract.unsupportedFlagsMask();
    }

    updateDAOManager = async (daoController: string) => {
        return await this.contract.updateDAOManager(daoController);
    }
}