import { addresses, ContractAddresses } from './lib/addresses';
import { gatewayTokenAddresses, GatewayTokenItem } from './lib/gatewaytokens';
import { BigNumber, BytesLike, getDefaultProvider, Signer, Transaction, utils, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

import { SUBTRACT_GAS_LIMIT, NETWORKS, } from './utils'
import { GatewayTokenItems } from "./utils/addresses";
import { signTranaction, TxOptions } from "./utils/tx";
import { estimateGasPrice, GasPriceKey } from "./utils/gas";
import { FlagsStorage, GatewayToken, GatewayTokenController } from "./contracts";
import { generateTokenId } from './utils/tokenId';
import { getExpirationTime } from './utils/time';
import { TokenState } from './utils/types';
import { checkTokenState } from './utils/token-state';
import { toBytes32 } from './utils/string';
import { GatewayTsBase } from './GatewayTsBase';

export class GatewayTsCallData extends GatewayTsBase {
    constructor(provider: BaseProvider,  signer?: Wallet, options?: { defaultGas?: number; defaultGasPrice?: any; }) {
        super(provider, signer, options);
    
        super.setGasLimit();
    }

    async issue(owner: string, tokenId: number | BigNumber = null, expiration?: number, bitmask: Uint8Array = Uint8Array.from([0]), gatewayTokenAddress?: string, options?: TxOptions):Promise<Transaction> {
        const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
        if (tokenId === null) {
          tokenId = generateTokenId(owner, bitmask);
        }
    
        if (expiration != null) {
          let expirationDate = getExpirationTime(expiration);
          let args: any[] = [owner, tokenId, expirationDate];
        
          return signTranaction(contract, 'mintWithExpiration', args, options);
        } else {
          let args: any[] = [owner, tokenId];
        
          return signTranaction(contract, 'mint', args, options);
        }
    }
    
    async revoke(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<Transaction> {
        const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
        let args: any[] = [tokenId];
    
        return signTranaction(contract, 'revoke', args, options);
    }
    
    async burn(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<Transaction> {
        const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
        let args: any[] = [tokenId];
    
        return signTranaction(contract, 'burn', args, options);
    }
    
    async freeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<Transaction> {
        const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
        let args: any[] = [tokenId];
    
        return signTranaction(contract, 'freeze', args, options);
    }
    
    async unfreeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<Transaction> {
        const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
        let args: any[] = [tokenId];
    
        return signTranaction(contract, 'unfreeze', args, options);
    }
    
    async refresh(tokenId: number | BigNumber, expiry?: number, gatewayTokenAddress?: string, options?: TxOptions):Promise<Transaction> {
        const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
        let expirationDate = getExpirationTime(expiry);
        let args: any[] = [tokenId, expirationDate];
    
        return signTranaction(contract, 'setExpiration', args, options);
    }
}
