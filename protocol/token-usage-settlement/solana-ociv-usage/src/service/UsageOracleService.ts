import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  loadTransactions,
  SimpleProgramIdStrategy,
} from "../util/transactionUtils";

type GetUsageParams = {
  program: PublicKey;
  epoch: number;
};

export class UsageOracleService {
  constructor(private connection: Connection, private oracle: Keypair) {}

  // private getProvider = () => {
  //   const wallet = new Wallet(this.oracle);
  //   return new Provider(this.connection, wallet, {
  //     commitment: SOLANA_COMMITMENT,
  //   });
  // };

  private async getTransactionSignaturesForEpoch(
    dapp: PublicKey,
    epoch: number
  ) {
    const epochSchedule = await this.connection.getEpochSchedule();

    // TODO we need to make sure that we only consider FINALIZED Epochs here
    const firstSlot = epochSchedule.getFirstSlotInEpoch(epoch);
    // const lastSlot = epochSchedule.getLastSlotInEpoch(epoch);
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
    currentStartSlot = lastSlot - 5000;
    while (currentStartSlot < lastSlot) {
      let currentEndSlot = currentStartSlot + SLOT_WINDOW;
      if (currentEndSlot > lastSlot) {
        currentStartSlot = lastSlot;
      }
      console.log(`Window: ${currentStartSlot} - ${currentEndSlot}`);

      const sigs = await this.connection.getConfirmedSignaturesForAddress(
        dapp,
        currentStartSlot,
        currentEndSlot
      );
      // console.log(sigs);
      signatures = signatures.concat(sigs);
      // console.log(signatures)
      currentStartSlot = currentEndSlot;
    }

    return signatures;
  }

  async readUsage({ program, epoch }: GetUsageParams) {
    const fetched = await this.getTransactionSignaturesForEpoch(program, epoch);
    const billableTx = await loadTransactions(this.connection, fetched, [
      new SimpleProgramIdStrategy(program),
    ]);
    return billableTx;
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
