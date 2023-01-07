import { addFlagsToBitmask } from "./bitmask_flags";
import { ZERO_BN } from "./constants";
import { BigNumber } from "@ethersproject/bignumber";
import assert = require("assert");

describe("Bitmask flags test", function () {
  let bitmask: BigNumber = ZERO_BN;
  let flags: number[];

  it("Should return bitmask == 1 on adding flag with 0 index", function () {
    flags = [0];
    bitmask = addFlagsToBitmask(bitmask, flags);
    assert.equal(bitmask.toString(), "1");
  });

  it("Should return bitmask == 2 on adding flag with 1 index", function () {
    flags = [1];
    bitmask = addFlagsToBitmask(ZERO_BN, flags);
    assert.equal(bitmask.toString(), "2");
  });

  it("Should return bitmask == 4 on adding flag with 2 index", function () {
    flags = [2];
    bitmask = addFlagsToBitmask(ZERO_BN, flags);
    assert.equal(bitmask.toString(), "4");
  });

  it("Should return bitmask == 16 on adding flag with 4 index", function () {
    flags = [4];
    bitmask = addFlagsToBitmask(ZERO_BN, flags);
    assert.equal(bitmask.toString(), "16");
  });

  it("Should return bitmask == 992 on adding flags with indexes 5, 6, 7, 8, and 9", function () {
    flags = [5, 6, 7, 8, 9];
    bitmask = addFlagsToBitmask(ZERO_BN, flags);
    assert.equal(bitmask.toString(), "992");
  });
});
