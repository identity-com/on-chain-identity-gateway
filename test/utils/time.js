/*
 * Use code from https://medium.com/edgefund/time-travelling-truffle-tests-f581c1964687
 */
const ONE_SECOND = 1;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_YEAR = 365 * ONE_DAY;

const helper = require('ganache-time-traveler');

const getLatestTimestamp = async () => {
  return (await web3.eth.getBlock('latest')).timestamp;
};

const getTimestampPlusDays = async (days) => {
  return (await getLatestTimestamp()) + ONE_DAY * days;
};

module.exports = {
  ONE_SECOND,
  ONE_MINUTE,
  ONE_HOUR,
  ONE_DAY,
  ONE_YEAR,
  advanceTime: helper.advanceTime,
  advanceBlock: helper.advanceBlock,
  advanceBlockAndSetTime: helper.advanceBlockAndSetTime,
  advanceTimeAndBlock: helper.advanceTimeAndBlock,
  takeSnapshot: helper.takeSnapshot,
  revertToSnapshot: helper.revertToSnapshot,
  getLatestTimestamp,
  getTimestampPlusDays,
};
