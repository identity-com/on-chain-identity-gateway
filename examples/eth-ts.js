const { GatewayETH } = require('../dist/index.js');
const { ethTransaction, signTranaction } = require("../dist/utils/tx.js");
const { getDefaultProvider, Wallet, BigNumber, utils } = require('ethers');
require("dotenv/config");

(async function() {
    const provider = getDefaultProvider('ropsten', {infura: process.env.INFURA_KEY});
    let wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
    wallet = wallet.connect(provider);

    const gtLib = new GatewayETH(
        provider,
        wallet
    );
    await gtLib.init()
    const testUser = '0x57AB42d4fa756b6956b0cAf986a5f53bA90D9e28';

    let contract = await gtLib.gatewayTokens["0xfD745e67635A8c394C5644E676D2B507d60380DF"].tokenInstance.contract;

    let constrains = 1;
    let constrainsBytes = utils.arrayify(constrains)
    let tokenId = gtLib.generateTokenId(testUser, constrainsBytes);
    let parameters = [testUser, tokenId];
    
    let tx = await ethTransaction(contract, 'mint', parameters);
    console.log(tx);
})();