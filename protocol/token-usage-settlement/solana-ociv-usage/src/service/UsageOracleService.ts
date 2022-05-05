import { Connection } from "@solana/web3.js";
import {
  loadTransactions,
  ConfigBasedStrategy,
} from "../util/transactionUtils";
import { UsageConfig } from "./config";

type GetUsageParams = {
  startSlot: number;
  maxSlots: number;
};

export class UsageOracleService {
  constructor(private connection: Connection, private config: UsageConfig) {}

  private async getTransactionSignatures(startSlot: number, maxSlots: number) {
    const currentSlot = await this.connection.getSlot();

    const lastSlot = Math.min(startSlot + maxSlots, currentSlot);

    console.log(
      `Reading from Slot ${startSlot} to ${lastSlot}. Total: ${
        lastSlot - startSlot
      }`
    );

    // Split and Join into 1000 tx window
    let signatures: string[] = [];
    let currentStartSlot = startSlot;
    const SLOT_WINDOW = 10_000;

    // TODO: Parallelize
    while (currentStartSlot < lastSlot) {
      let currentEndSlot = currentStartSlot + SLOT_WINDOW;
      if (currentEndSlot > lastSlot) {
        currentEndSlot = lastSlot;
      }
      console.log(`Window: ${currentStartSlot} - ${currentEndSlot}`);

      const sigs = await this.connection.getConfirmedSignaturesForAddress(
        this.config.program,
        currentStartSlot,
        currentEndSlot
      );
      // console.log(sigs);
      signatures = signatures.concat(sigs);
      // console.log(signatures)
      currentStartSlot = currentEndSlot;
    }

    return { signatures, firstSlot: startSlot, lastSlot };
  }

  async readUsage({ startSlot, maxSlots }: GetUsageParams) {
    const { signatures, firstSlot, lastSlot } =
      await this.getTransactionSignatures(startSlot, maxSlots);

    const billableTx = await loadTransactions(this.connection, signatures, [
      new ConfigBasedStrategy(this.config),
    ]);
    return { billableTx, firstSlot, lastSlot };
  }

  // writeUsage({
  //   gatekeeper,
  //   dapp,
  //   epoch,
  //   amount,
  // }: Omit<RegisterUsageParams, "oracleProvider">): Promise<PublicKey> {
  //   const oracleProvider = this.getProvider();
  //   return registerUsage({
  //     amount,
  //     dapp,
  //     epoch,
  //     gatekeeper,
  //     oracleProvider,
  //   });
  // }
}
