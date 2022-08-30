import { expect, test } from "@oclif/test";

describe("closes a network", () => {
  test
    .stdout()
    .command(["network:close"])
    .it("runs close network command with ... params", (ctx) => {
      expect(ctx.stdout).to.contain("hello world!");
    });
});
