const { GatewayETH } = require('../dist/index.js');
const { getDefaultProvider, Wallet, utils } = require('ethers');
require("dotenv/config");

(async function() {
    const provider = getDefaultProvider('ropsten');
    let wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
    wallet = wallet.connect(provider);
    const network = await provider.getNetwork();

    const gtLib = new GatewayETH(
        wallet,
        network
    );

    const testUser = '0x57AB42d4fa756b6956b0cAf986a5f53bA90D9e28';

    let tx = await gtLib.addGatekeeper(testUser);
})();