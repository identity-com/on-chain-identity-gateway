import { providers } from 'ethers';
import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers';
import { DEFAULT_NETWORK } from './constants';

export const getLocalhostProvider = (): JsonRpcProvider => {
    return new providers.JsonRpcProvider();
}

export const getProvider = function(network: string = DEFAULT_NETWORK): BaseProvider {
    let provider: BaseProvider;

    if (network === "localhost" || network === 'hardhat') {
        provider = getLocalhostProvider();
    } else {
        provider = providers.getDefaultProvider(network);
    }

    return provider;
};
