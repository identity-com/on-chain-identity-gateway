import { expect, test } from "@oclif/test";

describe("updates a network", () => {
  test
    .stdout()
    .command(["network:update"])
    .it("runs update network command with ... params", (ctx) => {
      expect(ctx.stdout).to.contain("hello world!");
    });
});
