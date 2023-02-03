import { toBytes32 } from "./string";
import assert = require("assert");
import { utils } from "ethers";

describe("Check string conversions", function () {
  const sampleString = "SampleString";
  const invalidString = "ThisStringIsTooLongToPassConversionToBytes32";

  it("Try to convert string to bytes32 hex string", () => {
    const result = toBytes32(sampleString);
    assert.equal(utils.parseBytes32String(result), sampleString);
    assert.throws(() => {
      toBytes32(invalidString);
    }, new Error("bytes32 string must be less than 32 bytes"));
  });
});
