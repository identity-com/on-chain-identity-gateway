/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BigNumber, BigNumberish, Contract, ContractTransaction, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { TokenData } from "../utils/types";
import { TxBase } from "../utils/tx";

export class GatewayToken {
  contract: Contract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.GatewayToken,
      signerOrProvider
    );
  }

  getName = async (): Promise<string> => {
    return this.contract.name() as Promise<string>;
  };

  getSymbol = async (): Promise<string> => {
    return this.contract.symbol() as Promise<string>;
  };

  getControllerAddress = async (): Promise<string> => {
    return this.contract.controller() as Promise<string>;
  };

  getDeployerAddress = async (): Promise<string> => {
    return this.contract.deployer() as Promise<string>;
  };

  isTransfersRestricted = async (): Promise<boolean> => {
    return this.contract.transfersRestricted() as Promise<boolean>;
  };

  getBalance = async (account: string): Promise<BigNumber> => {
    return this.contract.balanceOf(account) as Promise<BigNumber>;
  };

  getTokenOwner = async (tokenID: BigNumberish): Promise<string> => {
    return this.contract.ownerOf(tokenID) as Promise<string>;
  };

  getIdentity = async (tokenID: BigNumberish): Promise<string> => {
    return this.contract.getIdentity(tokenID) as Promise<string>;
  };

  getToken = async (tokenID: BigNumberish): Promise<TokenData> => {
    return this.contract.getToken(tokenID) as Promise<TokenData>;
  };

  getTokenState = async (tokenID: BigNumberish): Promise<number> => {
    return this.contract.getTokenState(tokenID) as Promise<number>;
  };

  getTokenBitmask = async (
    tokenId: BigNumberish
  ): Promise<BigNumber> => {
    return this.contract.getTokenBitmask(tokenId) as Promise<BigNumber>;
  };

  getTokenURI = async (tokenID: BigNumberish): Promise<string> => {
    return this.contract.tokenURI(tokenID) as Promise<string>;
  };

  setTokenURI = async (
    tokenID: BigNumberish,
    tokenURI: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.setTokenURI(tokenID, tokenURI, txParams) as Promise<ContractTransaction>;
  };

  verifyTokenByTokenID = async (
    address: string,
    tokenID: BigNumberish
  ): Promise<boolean> => {
    return this.contract.verifyToken(address, tokenID) as Promise<boolean>;
  };

  verifyToken = async (address: string): Promise<boolean> => {
    return this.contract.verifyToken(address) as Promise<boolean>;
  };

  approve = async (
    tokenID: BigNumberish,
    addressTo: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.approve(addressTo, tokenID, txParams) as Promise<ContractTransaction>;
  };

  getApprovedAddress = async (tokenID: BigNumberish): Promise<string> => {
    return this.contract.getApproved(tokenID) as Promise<string>;
  };

  setApprovalForAll = async (
    operator: string,
    approved: boolean,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.setApprovalForAll(
      operator,
      approved,
      txParams
    ) as Promise<ContractTransaction>;
  };

  checkApprovalForAll = async (
    owner: string,
    operator: string
  ): Promise<boolean> => {
    return this.contract.isApprovedForAll(owner, operator) as Promise<boolean>;
  };

  transferFrom = async (
    from: string,
    to: string,
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.transferFrom(from, to, tokenID, txParams) as Promise<ContractTransaction>;
  };

  safeTransferFrom = async (
    from: string,
    to: string,
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.safeTransferFrom(
      from,
      to,
      tokenID,
      txParams
    ) as Promise<ContractTransaction>;
  };

  burn = async (
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.burn(tokenID, txParams) as Promise<ContractTransaction>;
  };

  revoke = async (
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.revoke(tokenID, txParams) as Promise<ContractTransaction>;
  };

  /* eslint-disable max-params */
  mint = async (
    to: string,
    tokenID: BigNumberish,
    expiration: BigNumberish,
    bitmask: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.mint(
      to,
      tokenID,
      expiration,
      bitmask,
      txParams
    ) as Promise<ContractTransaction>;
  };

  freeze = async (
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.freeze(tokenID, txParams) as Promise<ContractTransaction>;
  };

  unfreeze = async (
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.unfreeze(tokenID, txParams) as Promise<ContractTransaction>;
  };

  getExpiration = async (tokenID: BigNumberish): Promise<BigNumber> => {
    return this.contract.expiration(tokenID) as Promise<BigNumber>;
  };

  setExpiration = async (
    tokenID: BigNumberish,
    time: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.setExpiration(tokenID, time, txParams) as Promise<ContractTransaction>;
  };

  getTokenId = async (owner: string): Promise<BigNumber> => {
    return this.contract.getTokenId(owner) as Promise<BigNumber>;
  };

  setDefaultTokenId = async (
    owner: string,
    tokenID: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.setDefaultTokenId(owner, tokenID, txParams) as Promise<ContractTransaction>;
  };

  addGatekeeper = async (
    gatekeeper: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.addGatekeeper(gatekeeper, txParams) as Promise<ContractTransaction>;
  };

  removeGatekeeper = async (
    gatekeeper: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeGatekeeper(gatekeeper, txParams) as Promise<ContractTransaction>;
  };

  isGatekeeper = async (
    gatekeeper: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.isGatekeeper(gatekeeper, txParams) as Promise<ContractTransaction>;
  };

  addNetworkAuthority = async (
    authority: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.addNetworkAuthority(authority, txParams) as Promise<ContractTransaction>;
  };

  removeNetworkAuthority = async (
    authority: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeNetworkAuthority(authority, txParams) as Promise<ContractTransaction>;
  };

  isNetworkAuthority = async (
    authority: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.isNetworkAuthority(authority, txParams) as Promise<ContractTransaction>;
  };

  allowTransfers = async (txParams?: TxBase): Promise<ContractTransaction> => {
    return this.contract.allowTransfers(txParams) as Promise<ContractTransaction>;
  };

  stopTransfers = async (txParams?: TxBase): Promise<ContractTransaction> => {
    return this.contract.stopTransfers(txParams) as Promise<ContractTransaction>;
  };

  transferDAOManager = async (
    daoManager: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.transferDAOManager(daoManager, txParams) as Promise<ContractTransaction>;
  };

  updateFlagsStorage = async (
    flagsStorage: string,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.updateFlagsStorage(flagsStorage, txParams) as Promise<ContractTransaction>;
  };

  setBitmask = async (
    tokenId: BigNumberish,
    bitmask: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.setBitmask(tokenId, bitmask, txParams) as Promise<ContractTransaction>;
  };

  addBitmask = async (
    tokenId: BigNumberish,
    bitmask: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.addBitmask(tokenId, bitmask, txParams) as Promise<ContractTransaction>;
  };

  addBit = async (
    tokenId: BigNumberish,
    index: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.addBit(tokenId, index, txParams) as Promise<ContractTransaction>;
  };

  removeBitmask = async (
    tokenId: BigNumberish,
    bitmask: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeBitmask(tokenId, bitmask, txParams) as Promise<ContractTransaction>;
  };

  removeBit = async (
    tokenId: BigNumberish,
    index: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeBit(tokenId, index, txParams) as Promise<ContractTransaction>;
  };

  removeUnsupportedBits = async (
    tokenId: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.removeUnsupportedBits(tokenId, txParams) as Promise<ContractTransaction>;
  };

  clearBitmask = async (
    tokenId: BigNumberish,
    txParams?: TxBase
  ): Promise<ContractTransaction> => {
    return this.contract.clearBitmask(tokenId, txParams) as Promise<ContractTransaction>;
  };

  anyHighRiskBits = async (
    tokenId: BigNumberish,
    highRiskBitmask: BigNumberish,
    txParams?: TxBase
  ): Promise<boolean> => {
    return this.contract.anyHighRiskBits(
      tokenId,
      highRiskBitmask,
      txParams
    ) as Promise<boolean>;
  };
}
