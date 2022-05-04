import { Connection } from "@solana/web3.js";
import {
  loadTransactions,
  ConfigBasedStrategy,
} from "../util/transactionUtils";
import { UsageConfig } from "./config";

type GetUsageParams = {
  startSlot: number;
  previousSlot?: number;
};

export class UsageOracleService {
  constructor(private connection: Connection, private config: UsageConfig) {}

  // private getProvider = () => {
  //   const wallet = new Wallet(this.oracle);
  //   return new Provider(this.connection, wallet, {
  //     commitment: SOLANA_COMMITMENT,
  //   });
  // };

  private async getTransactionSignatures(
    startSlot: number,
    previousSlot: number | undefined
  ) {
    // TODO we need to make sure that we only consider FINALIZED Epochs here
    const firstSlot = previousSlot ?? startSlot;
    const lastSlot = await this.connection.getSlot();

    console.log(
      `Reading from Slot ${firstSlot} to ${lastSlot}. Total: ${
        lastSlot - firstSlot
      }`
    );

    // Split and Join into 1000 tx window
    let signatures: string[] = [];
    let currentStartSlot = firstSlot;
    const SLOT_WINDOW = 1000;

    // TODO: Parallelize
    // Currently has a Max of 5k, e.g. 5 runthroughs
    currentStartSlot = previousSlot ? firstSlot : lastSlot - SLOT_WINDOW;
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

    return { signatures, firstSlot, lastSlot };
  }

  async readUsage({ startSlot, previousSlot }: GetUsageParams) {
    const { signatures, firstSlot, lastSlot } =
      await this.getTransactionSignatures(
        startSlot,
        previousSlot ? previousSlot + 1 : undefined
      );

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
