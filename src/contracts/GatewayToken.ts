import { BigNumber, Contract, Signer} from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import abis from "../lib/abis";
import { TxBase } from '../utils/tx';

export class GatewayToken {
    contract: Contract;

    constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
        this.contract = new Contract(
            addressOrName,
            abis.GatewayToken,
            signerOrProvider,
          );      
    }

    getName = async () => {
        return await this.contract.name()
    }

    getSymbol = async () => {
        return await this.contract.symbol()
    }

    getControllerAddress = async () => {
        return await this.contract.controller()
    }

    getDeployerAddress = async () => {
        return await this.contract.deployer()
    }

    isTransfersRestricted = async () => {
        return await this.contract.transfersRestricted()
    }

    getBalance = async (account: string) => {
        return await this.contract.balanceOf(account)
    }

    getTokenOwner = async (tokenID: number | BigNumber) => {
        return await this.contract.ownerOf(tokenID)
    }

    getIdentity = async (tokenID: number | BigNumber) => {
        return await this.contract.getIdentity(tokenID)
    }

    getToken = async (tokenID: number | BigNumber) => {
        return await this.contract.getToken(tokenID);
    }

    getTokenState = async (tokenID: number | BigNumber) => {
        return await this.contract.getTokenState(tokenID);
    }

    getTokenBitmask = async(tokenId: number | BigNumber) => {
        return await this.contract.getTokenBitmask(tokenId)
    }

    getTokenURI = async (tokenID: number | BigNumber) => {
        return await this.contract.tokenURI(tokenID)
    }

    setTokenURI = async (tokenID: number | BigNumber, tokenURI: string, txParams?: TxBase) => {
        return await this.contract.setTokenURI(tokenID, tokenURI, txParams)
    }

    verifyTokenByTokenID = async (address: string, tokenID: number | BigNumber) => {
        return await this.contract.functions['verifyToken(address,uint256)'](address, tokenID)
    }

    verifyToken = async (address: string) => {
        return await this.contract.functions["verifyToken(address)"](address)
    }

    approve = async (tokenID: number | BigNumber, addressTo: string, txParams?: TxBase) => {
        return await this.contract.approve(addressTo, tokenID, txParams)
    }

    getApprovedAddress = async (tokenID: number | BigNumber):Promise<string> => {
        return await this.contract.getApproved(tokenID)
    }

    setApprovalForAll = async (operator: string, approved: boolean, txParams?: TxBase) => {
        return await this.contract.setApprovalForAll(operator, approved, txParams)
    }

    checkApprovalForAll = async (owner: string, operator: string) => {
        return await this.contract.isApprovedForAll(owner, operator)
    }

    transferFrom = async (from: string, to: string, tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.transferFrom(from, to, tokenID, txParams)
    }

    safeTransferFrom = async (from: string, to: string, tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.safeTransferFrom(from, to, tokenID, txParams)
    }

    burn = async (tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.burn(tokenID, txParams)
    }

    revoke = async (tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.revoke(tokenID, txParams)
    }

    mint = async (to: string, tokenID: number | BigNumber | BigNumber, expiration: number | BigNumber = 0, bitmask: number | BigNumber = 0, txParams?: TxBase) => {
        return await this.contract.mint(to, tokenID, expiration, bitmask, txParams)
    }

    freeze = async (tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.freeze(tokenID, txParams)
    }

    unfreeze = async (tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.unfreeze(tokenID, txParams)
    }

    getExpiration = async (tokenID: number | BigNumber) => {
        return await this.contract.expiration(tokenID)
    }

    setExpiration = async (tokenID: number | BigNumber, time: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.setExpiration(tokenID, time, txParams)
    }

    getTokenId = async (owner: string) => {
        return await this.contract.getTokenId(owner)
    }

    setDefaultTokenId = async (owner: string, tokenID: number | BigNumber, txParams?: TxBase) => {
        return await this.contract.setDefaultTokenId(owner, tokenID, txParams)
    }

    addGatekeeper = async (gatekeeper: string, txParams?: TxBase) => {
        return await this.contract.addGatekeeper(gatekeeper, txParams)
    }

    removeGatekeeper = async (gatekeeper: string, txParams?: TxBase) => {
        return await this.contract.removeGatekeeper(gatekeeper, txParams)
    }

    isGatekeeper = async (gatekeeper: string, txParams?: TxBase): Promise<boolean> => {
        return await this.contract.isGatekeeper(gatekeeper, txParams)
    }

    addNetworkAuthority = async (authority: string, txParams?: TxBase) => {
        return await this.contract.addNetworkAuthority(authority, txParams)
    }

    removeNetworkAuthority = async (authority: string, txParams?: TxBase) => {
        return await this.contract.removeNetworkAuthority(authority, txParams)
    }

    isNetworkAuthority = async (authority: string, txParams?: TxBase): Promise<boolean> => {
        return await this.contract.isNetworkAuthority(authority, txParams)
    }

    allowTransfers = async (txParams?: TxBase): Promise<boolean> => {
        return await this.contract.allowTransfers(txParams)
    }

    stopTransfers = async (txParams?: TxBase): Promise<boolean> => {
        return await this.contract.stopTransfers(txParams)
    }

    transferDAOManager = async(daoManager: string, txParams?: TxBase) => {
        return await this.contract.transferDAOManager(daoManager, txParams)
    }

    updateFlagsStorage = async(flagsStorage: string, txParams?: TxBase) => {
        return await this.contract.updateFlagsStorage(flagsStorage, txParams)
    }

    setBitmask = async(tokenId: number | BigNumber, bitmask: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.setBitmask(tokenId, bitmask, txParams)
    }

    addBitmask = async(tokenId: number | BigNumber, bitmask: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.addBitmask(tokenId, bitmask, txParams)
    }

    addBit = async(tokenId: number | BigNumber, index: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.addBit(tokenId, index, txParams)
    }

    removeBitmask = async(tokenId: number | BigNumber, bitmask: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.removeBitmask(tokenId, bitmask, txParams)
    }

    removeBit = async(tokenId: number | BigNumber, index: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.removeBit(tokenId, index, txParams)
    }

    removeUnsupportedBits = async(tokenId: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.removeUnsupportedBits(tokenId, txParams)
    }

    clearBitmask = async(tokenId: number | BigNumber,  txParams?: TxBase) => {
        return await this.contract.clearBitmask(tokenId, txParams)
    }

    anyHighRiskBits = async(tokenId: number | BigNumber, highRiskBitmask: number | BigNumber, txParams?: TxBase): Promise<boolean> => {
        return await this.contract.anyHighRiskBits(tokenId, highRiskBitmask, txParams)
    }
}