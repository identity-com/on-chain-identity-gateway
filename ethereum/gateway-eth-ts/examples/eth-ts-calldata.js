const { DEFAULT_GATEWAY_TOKEN } = require("../dist/index.js");
const { GatewayTsCallData } = require("../dist/GatewayTsCallData.js");
const { signTransaction } = require("../dist/utils/tx.js");
const { getDefaultProvider, Wallet, BigNumber, utils } = require("ethers");
require("dotenv/config");

(async function () {
  const provider = getDefaultProvider("ropsten", {
    infura: process.env.INFURA_KEY,
  });
  let wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
  wallet = wallet.connect(provider);

  const gtCallDataLib = new GatewayTsCallData(provider, wallet);
  await gtCallDataLib.init();
  const testUser = "0x57AB42d4fa756b6956b0cAf986a5f53bA90D9e28";

  let gatewayToken = await gtCallDataLib.gatewayTokens[DEFAULT_GATEWAY_TOKEN]
    .tokenInstance;
  let constrains = BigNumber.from("0");
  let tokenId = gtCallDataLib.generateTokenId(
    testUser,
    constrains,
    gatewayToken
  );
  let tx = await gtCallDataLib.issue(testUser, tokenId);

  console.log(tx);
})();
