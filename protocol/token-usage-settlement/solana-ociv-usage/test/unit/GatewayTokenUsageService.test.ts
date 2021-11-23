import { describe } from "mocha";
import { GatewayTokenUsageService } from "../../src/service/GatewayTokenUsageService";
import { expect } from "chai";

describe("GatewayTokenUsageService", () => {
  it("should read data", () => {
    // @ts-ignore
    const gatewayTokenUsageService = new GatewayTokenUsageService(
      null,
      null,
      null
    ); // TODO

    expect(gatewayTokenUsageService.readUsage()).to.equal("TODO!");
  });
});
