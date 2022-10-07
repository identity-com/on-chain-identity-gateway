import { numToBuffer } from "../../../src";
import { expect } from "chai";

describe("util", () => {
  context("numToBuffer", () => {
    it("should calculate the expected buffer", () => {
      expect(numToBuffer(0).toString("hex")).to.equal("00");
      expect(numToBuffer(1).toString("hex")).to.equal("01");
      expect(numToBuffer(16).toString("hex")).to.equal("10");
      expect(numToBuffer(255).toString("hex")).to.equal("ff");
      expect(numToBuffer(256).toString("hex")).to.equal("0100");
      expect(numToBuffer(65535).toString("hex")).to.equal("ffff");
      expect(numToBuffer(65536).toString("hex")).to.equal("010000");
      expect(numToBuffer(4294967296).toString("hex")).to.equal("0100000000");
      expect(numToBuffer(2 ** 64).toString("hex")).to.equal(
        "010000000000000000"
      );
    });
  });
});
