/* eslint-disable @typescript-eslint/require-await */
import { getExpirationTime } from "./time";
import { BigNumber } from "ethers/lib/ethers";
import assert = require("assert");
import { DEFAULT_EXPIRATION_BN } from "./constants";

describe("Check expiration calculations", function () {
  let now: number;
  let nowBN: BigNumber;
  let expiration;

  const _30days = BigNumber.from(30 * 24 * 60 * 60);
  const _minus15days = BigNumber.from(-15 * 24 * 60 * 60);
  const _1850days = 1850 * 24 * 60 * 60;

  it("Try to add 30 days to current time, expect results being equal", async () => {
    now = Math.floor(Date.now() / 1000);
    nowBN = BigNumber.from(now);
    const timeSum = nowBN.add(_30days);

    expiration = getExpirationTime(_30days);
    assert.equal(expiration.toString(), timeSum.toString());
  });

  it("Try to add 1850 days to current time, expect results being equal", async () => {
    now = Math.floor(Date.now() / 1000);
    nowBN = BigNumber.from(now);
    const timeSum = nowBN.add(BigNumber.from(_1850days));

    expiration = getExpirationTime(_1850days);
    assert.equal(expiration.toString(), timeSum.toString());
  });

  it("Try to add -15 days to current time, expect adding default expiration (14 days)", async () => {
    now = Math.floor(Date.now() / 1000);
    nowBN = BigNumber.from(now);
    const timeSum = nowBN.add(DEFAULT_EXPIRATION_BN);

    expiration = getExpirationTime(_minus15days);
    assert.equal(expiration.toString(), timeSum.toString());
  });
});
