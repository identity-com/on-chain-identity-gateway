import { describe } from "mocha";
import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getConnection, UsageOracleService } from "../../../src";

describe("UsageOracleService", function () {
  this.timeout(30_000);

  const oracle = Keypair.generate();
  // const gatekeeper = Keypair.generate();
  // const dapp = new PublicKey("D3z8BLmMnPD1LaKwCkyCisM7iDyw9PsXXmvatUwjCuqT");
  // const dapp = new PublicKey("FRQb9goeMow4BjNH6yH1vSBicWDhZTgeXsUgkBFbehft")
  // const dapp = new PublicKey("Hx2YiHbtU91ipPQRptZ5yusuhyAF99ykz2Jh7tdtHn23")
  const dapp = new PublicKey("Hx2YiHbtU91ipPQRptZ5yusuhyAF99ykz2Jh7tdtHn23");
  // const dapp = new PublicKey("Bx2A5FyD693PzTMx7T7v2bXNYFvwBd54UKZaXfvSzGd3")

  it("should read data", async () => {
    const connection = getConnection();

    const usageOracleService = new UsageOracleService(connection, oracle);

    const usage = await usageOracleService.readUsage({
      startSlot: 226,
    });

    console.log(usage);

    expect(usage.billableTx.length).to.equal(1000);
  });
});
