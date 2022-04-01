import { parseTokenState, checkTokenState } from "./token-state";
import assert = require("assert");
import { TokenData } from "./types";

describe("Test token state checks", function () {
  const defaultTokenData: TokenData = {
    owner: "0x0",
    state: 0,
    identity: "",
    expiration: "",
    bitmask: "",
  };

  it("Test token state checks", () => {
    let state = checkTokenState(0);
    assert.equal(state, "ACTIVE");

    state = checkTokenState(1);
    assert.equal(state, "FROZEN");

    state = checkTokenState(2);
    assert.equal(state, "REVOKED");

    state = checkTokenState(3);
    assert.equal(state, "");
  });

  it("Test token state parsing from TokenData", () => {
    let state = parseTokenState(defaultTokenData);
    assert.equal(state.state, "ACTIVE");

    defaultTokenData.state = 1;
    state = parseTokenState(defaultTokenData);
    assert.equal(state.state, "FROZEN");

    defaultTokenData.state = 2;
    state = parseTokenState(defaultTokenData);
    assert.equal(state.state, "REVOKED");

    defaultTokenData.state = 3;
    state = parseTokenState(defaultTokenData);
    assert.equal(state.state, "");
  });
});
