import { Contract, Signer } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import abis from "../lib/abis";
import { TxBase } from '../utils/tx';

export class GatewayTokenController {
    contract: Contract;

    constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
        this.contract = new Contract(
            addressOrName,
            abis.GatewayTokenController,
            signerOrProvider,
          );      
    }

    transferAdmin = async (newAdmin: string, txParams?: TxBase) => {
        return await this.contract.transferAdmin(newAdmin, txParams)
    }

    setFlagsStorage = async (flagsStorage: string, txParams?: TxBase) => {
        return await this.contract.setFlagsStorage(flagsStorage, txParams);
    }

    acceptTransfersBatch = async (tokens: string[], txParams?: TxBase) => {
        return await this.contract.acceptTransfersBatch(tokens, txParams)
    }

    restrictTransfersBatch = async (tokens: string[], txParams?: TxBase) => {
        return await this.contract.restrictTransfersBatch(tokens, txParams)
    }

    blacklist = async (user: string, txParams?: TxBase) => {
        return await this.contract.blacklist(user, txParams)
    }

    blacklistBatch = async (users: string[], txParams?: TxBase) => {
        return await this.contract.blacklistBatch(users, txParams)
    }

    isBlacklisted = async (user: string) => {
        return await this.contract.isBlacklisted(user)
    }

    createGatekeeperNetwork = async (name: string, symbol: string, isDAOGoverned:boolean, daoManager: string, txParams?: TxBase) => {
        return await this.contract.createGatekeeperNetwork(name, symbol, isDAOGoverned, daoManager, txParams)
    }

    addNetworkAuthorities = async (token: string, authorities: string[], txParams?: TxBase) => {
        return await this.contract.addNetworkAuthorities(token, authorities, txParams)
    }

    removeNetworkAuthorities = async (token: string, authorities: string[], txParams?: TxBase) => {
        return await this.contract.removeNetworkAuthorities(token, authorities, txParams)
    }

}