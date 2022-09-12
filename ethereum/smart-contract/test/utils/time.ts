import { ethers } from "hardhat";
const { BigNumber } = ethers

/*
 * Use code from https://medium.com/edgefund/time-travelling-truffle-tests-f581c1964687
 */
export const ONE_SECOND = BigNumber.from('1');
export const ONE_MINUTE = BigNumber.from('60').mul(ONE_SECOND);
export const ONE_HOUR = BigNumber.from('60').mul(ONE_MINUTE);
export const ONE_DAY = BigNumber.from('24').mul(ONE_HOUR);
export const ONE_YEAR = BigNumber.from('365').mul(ONE_DAY);

export const getLatestTimestamp = async () => {
	const block = await ethers.provider.getBlock("latest");
	return BigNumber.from(block.timestamp);
};

export async function advanceBlock() {
  	return ethers.provider.send("evm_mine", [])
}

export async function advanceTime(time) {
  	await ethers.provider.send("evm_increaseTime", [time])
}

export async function advanceTimeAndBlock(time) {
	await advanceTime(time)
	await advanceBlock()
}

export const getTimestampPlusDays = async (days) => {
	const timestamp = await getLatestTimestamp();
	return timestamp.add(ONE_DAY.mul(BigNumber.from(days)));
};
