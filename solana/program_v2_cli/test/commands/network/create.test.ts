import { expect, test } from "@oclif/test";

describe("creates a network", () => {
  test
    .stdout()
    .command(["network:create"])
    .it("runs create network command with ... params", (ctx) => {
      expect(ctx.stdout).to.contain("hello world!");
    });
});
