import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers';
import { getProvider, getLocalhostProvider } from './providers';
import assert = require('assert');

describe('Check ethers provider', function() {
    let provider: BaseProvider;
    const mainnetNetworkID = 1;
    const ropstenNetworkID = 3;
    
    it('Try connect to mainnet ethers provider, check network ID', async () => {
        provider = getProvider('mainnet');
        const networkId = await (await provider.getNetwork()).chainId;

        assert.equal(networkId, mainnetNetworkID);
    });

    it('Try connect to ropsten ethers provider, check network ID', async () => {
        provider = getProvider('ropsten');
        const networkId = await (await provider.getNetwork()).chainId;

        assert.equal(networkId, ropstenNetworkID);
    });

    it('Try connect to localhost provider, check connection URL', async () => {
        const provider: JsonRpcProvider = getLocalhostProvider();
        assert.equal(provider.connection.url, 'http://localhost:8545');
    });

});