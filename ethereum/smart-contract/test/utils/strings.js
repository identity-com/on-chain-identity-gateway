const utils = require('web3-utils');

/**
 * Converts a string into a hex representation of bytes32, with right padding
 */
const toBytes32 = key => utils.rightPad(utils.asciiToHex(key), 64);
const fromBytes32 = key => utils.hexToAscii(key);
 
 module.exports = {
     toBytes32,
     fromBytes32
 }