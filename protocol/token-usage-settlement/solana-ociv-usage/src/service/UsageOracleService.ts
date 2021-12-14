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
import { DummyStrategy, loadTransactions, NativeTransferStrategy } from "../lib/transactionUtils";

const DEFAULT_COMMITMENT: web3.Commitment = "confirmed";

type PaginationProps = { offset: number; limit: number };

export class UsageOracleService {
  private connection: Connection;

  constructor(private oracle: Keypair, private cluster: ExtendedCluster) {
    this.connection = new Connection(
      getClusterUrl(cluster),
      DEFAULT_COMMITMENT
    );
  }

  private getProvider = () => {
    const wallet = new Wallet(this.oracle);
    return new Provider(this.connection, wallet, {
      commitment: DEFAULT_COMMITMENT,
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
    const lastSlot = epochSchedule.getLastSlotInEpoch(epoch);

    // Split and Join into 1000 tx window
    const signatures: string[] = []
    let currentStartSlot = firstSlot;
    const SLOT_WINDOW = 1000;

    // TODO: Parallelize
    // TODO: Handle "Error: failed to get confirmed block: Block 1001 cleaned up, does not exist on node. First available block: 44478"
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
      signatures.concat(sigs)
      currentStartSlot = currentEndSlot
    }

    // TODO fix deprecation
    return signatures
  }

  async readUsage({
    gatekeeper,
    dapp,
    epoch,
  }: Omit<RegisterUsageParams, "oracleProvider" | "amount"> & PaginationProps) {
    const fetched = await this.getTransactionSignaturesForEpoch(dapp, epoch);
    // TODO filter/map and reduce

    const billableTx = await loadTransactions(this.connection, fetched, [new NativeTransferStrategy()])

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
