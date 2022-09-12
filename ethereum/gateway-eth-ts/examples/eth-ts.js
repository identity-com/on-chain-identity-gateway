const { GatewayETH, DEFAULT_GATEWAY_TOKEN } = require('../dist/index.js');
const { ethTransaction, signTranaction } = require("../dist/utils/tx.js");
const { getExpirationTime } = require("../dist/utils/time.js");

const { getDefaultProvider, Wallet, BigNumber, utils } = require('ethers');
require("dotenv/config");

(async function() {
    const provider = getDefaultProvider('ropsten', {infura: process.env.INFURA_KEY});
    let wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
    wallet = wallet.connect(provider);
    const network = await provider.getNetwork();
    
    const gtLib = new GatewayETH(wallet, network);
    const testUser = '0x57AB42d4fa756b6956b0cAf986a5f53bA90D9e28';

    let gatewayToken = await gtLib.gatewayTokens[DEFAULT_GATEWAY_TOKEN].tokenInstance
    let contract = gatewayToken.contract;

    let tokenId = await gtLib.generateTokenId(testUser, BigNumber.from(2), gatewayToken);

    let expiration = getExpirationTime();
    let bitmask = BigNumber.from('2');
    let parameters = [testUser, tokenId, expiration, bitmask];
    
    let tx = await ethTransaction(contract, 'mint', parameters);
    console.log(tx);
})();