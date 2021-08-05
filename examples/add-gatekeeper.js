const { GatewayETH } = require('../dist/index.js');
const { getDefaultProvider, Wallet } = require('ethers');
require("dotenv/config");

(async function() {
    const provider = getDefaultProvider('ropsten');
    let wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
    wallet = wallet.connect(provider);

    const gtLib = new GatewayETH(
        provider,
        3,
        wallet
    );

    const testUser = '0xAb5c43F9AA45F942FF09AD30c36eeb3515C23AEa';

    let tx = await gtLib.addGatekeeper(testUser)
    console.log(tx.transactionHash);
})();