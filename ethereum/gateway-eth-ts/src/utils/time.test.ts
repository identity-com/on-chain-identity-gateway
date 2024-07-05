import { getExpirationTime } from "./time";
import assert = require("assert");

describe("Check expiration calculations", () => {
  let now: number;
  let nowBN: bigint;
  let expiration: bigint;

  const _30days = BigInt(30 * 24 * 60 * 60);
  const _minus15days = BigInt(-15 * 24 * 60 * 60);
  const _1850days = 1850 * 24 * 60 * 60;

  it("Try to add 30 days to current time, expect results being equal", () => {
    now = Math.floor(Date.now() / 1000);
    nowBN = BigInt(now);
    const timeSum = nowBN + _30days;

    expiration = getExpirationTime(_30days);
    assert.equal(expiration.toString(), timeSum.toString());
  });

  it("Try to add 1850 days to current time, expect results being equal", () => {
    now = Math.floor(Date.now() / 1000);
    nowBN = BigInt(now);
    const timeSum = nowBN + BigInt(_1850days);

    expiration = getExpirationTime(_1850days);
    assert.equal(expiration.toString(), timeSum.toString());
  });

  it("Try to add -15 days to current time, expect an error", () => {
    now = Math.floor(Date.now() / 1000);
    nowBN = BigInt(now);

    assert.throws(() => getExpirationTime(_minus15days));
  });
});
