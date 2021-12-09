import {
  ConfirmedSignaturesForAddress2Options,
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  ExtendedCluster,
  registerUsage,
  RegisterUsageParams,
  getClusterUrl,
} from "@identity.com/gateway-usage";
import { Provider, Wallet, web3 } from "@project-serum/anchor";
import {
  DevDummyGatekeeperNetwork,
  DummyStrategy,
  loadTransactions,
  NativeTransferStrategy,
} from "../util/transactionUtils";
import { SOLANA_COMMITMENT } from "../util/constants";

type PaginationProps = { offset: number; limit: number };

export class UsageOracleService {
  constructor(private connection: Connection, private oracle: Keypair) {
  }

  private getProvider = () => {
    const wallet = new Wallet(this.oracle);
    return new Provider(this.connection, wallet, {
      commitment: SOLANA_COMMITMENT,
    });
  };

  private async getTransactionSignaturesForEpoch(
    dapp: web3.PublicKey,
    epoch: number
  ) {
    // TODO we might want to cache this - it should never change after an epoch is over
    const epochSchedule = await this.connection.getEpochSchedule();

    // TODO we need to make sure that we only consider FINALIZED Epochs here
    const firstSlot = epochSchedule.getFirstSlotInEpoch(epoch);
    // const lastSlot = epochSchedule.getLastSlotInEpoch(epoch);
    const lastSlot = await this.connection.getSlot()

    console.log(`Reading from Slot ${firstSlot} to ${lastSlot}. Total: ${lastSlot - firstSlot}`)


    // Split and Join into 1000 tx window
    let signatures: string[] = []
    let currentStartSlot = firstSlot;
    const SLOT_WINDOW = 1000;

    // TODO: Parallelize
    // Currently has a Max of 5k, e.g. 5 runthroughs
    currentStartSlot = lastSlot - 10000
    while( currentStartSlot < lastSlot) {
      console.log(`Window: ${currentStartSlot}`)
      let currentEndSlot = currentStartSlot + SLOT_WINDOW
      if (currentEndSlot > lastSlot) {
        currentStartSlot = lastSlot
      }

      const sigs = await this.connection.getConfirmedSignaturesForAddress(
        dapp,
        currentStartSlot,
        currentEndSlot
      )
      console.log(sigs)
      signatures = signatures.concat(sigs)
      currentStartSlot = currentEndSlot
    }

    // TODO fix deprecation
    return signatures
  }

  async readUsage({
    dapp,
    epoch,
  }: Omit<RegisterUsageParams, "oracleProvider" | "amount" | "gatekeeper">) {
    // TODO readd pagination props.

    const fetched = await this.getTransactionSignaturesForEpoch(dapp, epoch);
    // TODO filter/map and reduce

    const billableTx = await loadTransactions(this.connection, fetched, [new DevDummyGatekeeperNetwork(new PublicKey(
      "gcmJfhh9k7hiEbKYb4ehHEQJGrdtCrmvxw1bgiB56Vb"
    ), dapp)])

    return billableTx;
  }

  writeUsage({
    gatekeeper,
    dapp,
    epoch,
    amount,
  }: Omit<RegisterUsageParams, "oracleProvider">): Promise<PublicKey> {
    const oracleProvider = this.getProvider();
    return registerUsage({
      amount,
      dapp,
      epoch,
      gatekeeper,
      oracleProvider,
    });
  }
}
