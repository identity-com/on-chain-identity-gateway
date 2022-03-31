/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */

import { BigNumber, Contract, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { TxBase } from "../utils/tx";
import { TokenData } from "../utils/types";

export class GatewayToken {
  contract: Contract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.GatewayToken,
      signerOrProvider
    );
  }

  getName = async (): Promise<unknown> => {
    return this.contract.name() as unknown;
  };

  getSymbol = async (): Promise<unknown> => {
    return this.contract.symbol() as unknown;
  };

  getControllerAddress = async (): Promise<unknown> => {
    return this.contract.controller() as unknown;
  };

  getDeployerAddress = async (): Promise<unknown> => {
    return this.contract.deployer() as unknown;
  };

  isTransfersRestricted = async (): Promise<unknown> => {
    return this.contract.transfersRestricted() as unknown;
  };

  getBalance = async (account: string): Promise<number | BigNumber> => {
    return this.contract.balanceOf(account) as number | BigNumber;
  };

  getTokenOwner = async (tokenID: number | BigNumber): Promise<unknown> => {
    return this.contract.ownerOf(tokenID) as unknown;
  };

  getIdentity = async (tokenID: number | BigNumber): Promise<unknown> => {
    return this.contract.getIdentity(tokenID) as unknown;
  };

  getToken = async (tokenID: number | BigNumber): Promise<TokenData> => {
    return this.contract.getToken(tokenID) as TokenData;
  };

  getTokenState = async (tokenID: number | BigNumber): Promise<number> => {
    return this.contract.getTokenState(tokenID) as number;
  };

  getTokenBitmask = async (
    tokenId: number | BigNumber
  ): Promise<number | BigNumber> => {
    return this.contract.getTokenBitmask(tokenId) as number | BigNumber;
  };

  getTokenURI = async (tokenID: number | BigNumber): Promise<unknown> => {
    return this.contract.tokenURI(tokenID) as unknown;
  };

  setTokenURI = async (
    tokenID: number | BigNumber,
    tokenURI: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.setTokenURI(tokenID, tokenURI, txParams) as unknown;
  };

  verifyTokenByTokenID = async (
    address: string,
    tokenID: number | BigNumber
  ): Promise<any> => {
    return this.contract.functions["verifyToken(address,uint256)"](
      address,
      tokenID
    ) as unknown;
  };

  verifyToken = async (address: string): Promise<unknown> => {
    return this.contract.functions["verifyToken(address)"](address);
  };

  approve = async (
    tokenID: number | BigNumber,
    addressTo: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.approve(addressTo, tokenID, txParams) as unknown;
  };

  getApprovedAddress = async (tokenID: number | BigNumber): Promise<string> => {
    return this.contract.getApproved(tokenID) as string;
  };

  setApprovalForAll = async (
    operator: string,
    approved: boolean,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.setApprovalForAll(
      operator,
      approved,
      txParams
    ) as unknown;
  };

  checkApprovalForAll = async (
    owner: string,
    operator: string
  ): Promise<unknown> => {
    return this.contract.isApprovedForAll(owner, operator) as unknown;
  };

  transferFrom = async (
    from: string,
    to: string,
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.transferFrom(from, to, tokenID, txParams) as unknown;
  };

  safeTransferFrom = async (
    from: string,
    to: string,
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.safeTransferFrom(
      from,
      to,
      tokenID,
      txParams
    ) as unknown;
  };

  burn = async (
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.burn(tokenID, txParams) as unknown;
  };

  revoke = async (
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.revoke(tokenID, txParams) as unknown;
  };

  mint = async (
    to: string,
    tokenID: number | BigNumber,
    expiration: number | BigNumber,
    bitmask: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.mint(
      to,
      tokenID,
      expiration,
      bitmask,
      txParams
    ) as unknown;
  };

  freeze = async (
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.freeze(tokenID, txParams) as unknown;
  };

  unfreeze = async (
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.unfreeze(tokenID, txParams) as unknown;
  };

  getExpiration = async (tokenID: number | BigNumber): Promise<unknown> => {
    return this.contract.expiration(tokenID) as unknown;
  };

  setExpiration = async (
    tokenID: number | BigNumber,
    time: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.setExpiration(tokenID, time, txParams) as unknown;
  };

  getTokenId = async (owner: string): Promise<number | BigNumber> => {
    return this.contract.getTokenId(owner) as number | BigNumber;
  };

  setDefaultTokenId = async (
    owner: string,
    tokenID: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.setDefaultTokenId(owner, tokenID, txParams) as unknown;
  };

  addGatekeeper = async (
    gatekeeper: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.addGatekeeper(gatekeeper, txParams) as unknown;
  };

  removeGatekeeper = async (
    gatekeeper: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeGatekeeper(gatekeeper, txParams) as unknown;
  };

  isGatekeeper = async (
    gatekeeper: string,
    txParams?: TxBase
  ): Promise<boolean> => {
    return this.contract.isGatekeeper(gatekeeper, txParams) as boolean;
  };

  addNetworkAuthority = async (
    authority: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.addNetworkAuthority(authority, txParams) as unknown;
  };

  removeNetworkAuthority = async (
    authority: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeNetworkAuthority(authority, txParams) as unknown;
  };

  isNetworkAuthority = async (
    authority: string,
    txParams?: TxBase
  ): Promise<boolean> => {
    return this.contract.isNetworkAuthority(authority, txParams) as boolean;
  };

  allowTransfers = async (txParams?: TxBase): Promise<boolean> => {
    return this.contract.allowTransfers(txParams) as boolean;
  };

  stopTransfers = async (txParams?: TxBase): Promise<boolean> => {
    return this.contract.stopTransfers(txParams) as boolean;
  };

  transferDAOManager = async (
    daoManager: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.transferDAOManager(daoManager, txParams) as unknown;
  };

  updateFlagsStorage = async (
    flagsStorage: string,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.updateFlagsStorage(flagsStorage, txParams) as unknown;
  };

  setBitmask = async (
    tokenId: number | BigNumber,
    bitmask: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.setBitmask(tokenId, bitmask, txParams) as unknown;
  };

  addBitmask = async (
    tokenId: number | BigNumber,
    bitmask: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.addBitmask(tokenId, bitmask, txParams) as unknown;
  };

  addBit = async (
    tokenId: number | BigNumber,
    index: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.addBit(tokenId, index, txParams) as unknown;
  };

  removeBitmask = async (
    tokenId: number | BigNumber,
    bitmask: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeBitmask(tokenId, bitmask, txParams) as unknown;
  };

  removeBit = async (
    tokenId: number | BigNumber,
    index: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeBit(tokenId, index, txParams) as unknown;
  };

  removeUnsupportedBits = async (
    tokenId: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.removeUnsupportedBits(tokenId, txParams) as unknown;
  };

  clearBitmask = async (
    tokenId: number | BigNumber,
    txParams?: TxBase
  ): Promise<unknown> => {
    return this.contract.clearBitmask(tokenId, txParams) as unknown;
  };

  anyHighRiskBits = async (
    tokenId: number | BigNumber,
    highRiskBitmask: number | BigNumber,
    txParams?: TxBase
  ): Promise<boolean> => {
    return this.contract.anyHighRiskBits(
      tokenId,
      highRiskBitmask,
      txParams
    ) as boolean;
  };
}
