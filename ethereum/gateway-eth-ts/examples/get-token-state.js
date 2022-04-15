const { GatewayETH } = require('../dist/index.js');
const { getDefaultProvider, Wallet, BigNumber } = require('ethers');
require("dotenv/config");

(async function() {
    const provider = getDefaultProvider('ropsten', {infura: process.env.INFURA_KEY});
    let wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
    wallet = wallet.connect(provider);
    const network = await provider.getNetwork();

    const gtLib = new GatewayETH(wallet, network);

    const testUser = '0xD42Ef952F2EA1E77a8b771884f15Bf20e35cF85f';
    let tokenId = await gtLib.getDefaultTokenId(testUser);
    let tx = await gtLib.getTokenState(tokenId);
    
    console.log(tx);
})();