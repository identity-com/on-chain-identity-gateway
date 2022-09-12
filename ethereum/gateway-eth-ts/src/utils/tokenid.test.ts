import { generateId } from "./tokenId";
import assert = require("assert");
import { BigNumber } from "@ethersproject/bignumber";
import { utils } from "ethers/lib/ethers";

describe("Test token id generation", function () {
  const sampleAddress = "0x2de1EFea6044b44432aedBC9f29861296695AF0C";
  let id: BigNumber;

  it("Try to generate token id with constrains equal 1", () => {
    const constrains = BigNumber.from("1");
    id = generateId(sampleAddress, constrains);

    const hexConstrains = utils.hexlify(constrains);
    const resultHexString = utils.hexZeroPad(
      hexConstrains + sampleAddress.slice(2),
      32
    );
    const parsedHexString = utils.hexlify(resultHexString);
    const targetResult = BigNumber.from(parsedHexString);
    assert.equal(id.toHexString(), targetResult.toHexString());
  });

  it("Try to generate token id with constrains equal 8192", () => {
    const constrains = BigNumber.from("8192");
    id = generateId(sampleAddress, constrains);
    const hexConstrains = utils.hexlify(constrains);
    const resultHexString = utils.hexZeroPad(
      hexConstrains + sampleAddress.slice(2),
      32
    );
    const parsedHexString = utils.hexlify(resultHexString);
    const targetResult = BigNumber.from(parsedHexString);
    assert.equal(id.toHexString(), targetResult.toHexString());
  });

  it("Try to generate token id with constrains equal 2 by the power of 104, expect byte overflow", () => {
    const constrains = BigNumber.from("2").pow(104);
    assert.throws(() => {
      generateId(sampleAddress, constrains);
    }, Error);
  });
});
