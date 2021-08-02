import { Contract, Wallet } from 'ethers';
import abis from "../lib/abis";
import { TxBase } from '../utils/tx';

export class GatewayToken {
    contract: Contract;

    constructor(signer: Wallet, addressOrName: string, provider: any = {}) {
        this.contract = new Contract(
            addressOrName,
            abis.GatewayToken,
            signer || provider
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

    getTokenOwner = async (tokenId: number) => {
        return await this.contract.ownerOf(tokenId)
    }

    getIdentity = async (tokenId: number) => {
        return await this.contract.getIdentity(tokenId)
    }

    getTokenURI = async (tokenId: number) => {
        return await this.contract.tokenURI(tokenId)
    }

    setTokenURI = async (tokenId: number, tokenURI: string, txParams?: TxBase) => {
        return await this.contract.setTokenURI(tokenId, tokenURI, txParams)
    }

    verifyTokenByTokenID = async (address: string, tokenId: number) => {
        return await this.contract.functions['verifyToken(address,uint256)'](address, tokenId)
    }

    verifyToken = async (address: string) => {
        return await this.contract.functions["verifyToken(address)"](address)
    }

    approve = async (tokenId: number, addressTo: string, txParams?: TxBase) => {
        return await this.contract.approve(addressTo, tokenId, txParams)
    }

    getApprovedAddress = async (tokenId: number):Promise<string> => {
        return await this.contract.getApproved(tokenId)
    }

    setApprovalForAll = async (operator: string, approved: boolean, txParams?: TxBase) => {
        return await this.contract.setApprovalForAll(operator, approved, txParams)
    }

    checkApprovalForAll = async (owner: string, operator: string) => {
        return await this.contract.isApprovedForAll(owner, operator)
    }

    transferFrom = async (from: string, to: string, tokenID: number, txParams?: TxBase) => {
        return await this.contract.transferFrom(from, to, tokenID, txParams)
    }

    safeTransferFrom = async (from: string, to: string, tokenID: number, txParams?: TxBase) => {
        return await this.contract.safeTransferFrom(from, to, tokenID, txParams)
    }

    burn = async (tokenID: number, txParams?: TxBase) => {
        return await this.contract.burn(tokenID, txParams)
    }

    mint = async (to: string, tokenID: number, txParams?: TxBase) => {
        return await this.contract.mint(to, tokenID, txParams)
    }

    freeze = async (tokenID: number, txParams?: TxBase) => {
        return await this.contract.freeze(tokenID, txParams)
    }

    unfreeze = async (tokenID: number, txParams?: TxBase) => {
        return await this.contract.unfreeze(tokenID, txParams)
    }

    getExpiration = async (tokenID: number) => {
        return await this.contract.expiration(tokenID)
    }

    setExpiration = async (tokenID: number, time: number, txParams?: TxBase) => {
        return await this.contract.setExpiration(tokenID, time, txParams)
    }

    addGatekeeper = async (gatekeeper: string, txParams?: TxBase) => {
        return await this.contract.addGatekeeper(gatekeeper, txParams)
    }

    removeGatekeeper = async (gatekeeper: string, txParams?: TxBase) => {
        return await this.contract.removeGatekeeper(gatekeeper, txParams)
    }

    addNetworkAuthority = async (authority: string, txParams?: TxBase) => {
        return await this.contract.addNetworkAuthority(authority, txParams)
    }

    removeNetworkAuthority = async (authority: string, txParams?: TxBase) => {
        return await this.contract.removeNetworkAuthority(authority, txParams)
    }

    allowTransfers = async (txParams?: TxBase) => {
        return await this.contract.allowTransfers(txParams)
    }

    stopTransfers = async (txParams?: TxBase) => {
        return await this.contract.stopTransfers(txParams)
    }

}