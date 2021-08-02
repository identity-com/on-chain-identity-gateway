import { providers } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import { DEFAULT_NETWORK } from './constants';

export const getProvider = function(network: string = DEFAULT_NETWORK): BaseProvider {
    var provider: BaseProvider;

    if (network === "localhost" || network === 'hardhat') {
        provider = getLocalhostProvider();
    } else {
        provider = providers.getDefaultProvider(network);
    }

    return provider;
};

export const getLocalhostProvider = (): BaseProvider => {
    return new providers.JsonRpcProvider();
}