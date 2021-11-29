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

const DEFAULT_COMMITMENT: web3.Commitment = "confirmed";

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
    // TODO we might want to cache this - it should never change
    const epochSchedule = await this.connection.getEpochSchedule();

    const firstSlot = epochSchedule.getFirstSlotInEpoch(epoch);
    const lastSlot = epochSchedule.getLastSlotInEpoch(epoch);

    // TODO fix deprecation
    // pagination - only returns the first 1000 transaction
    return this.connection.getConfirmedSignaturesForAddress(
      dapp,
      firstSlot,
      lastSlot
    );
  }

  async readUsage({
    gatekeeper,
    dapp,
    epoch,
    offset,
    limit
  }: Omit<RegisterUsageParams, "oracleProvider" | "amount">) {
    const fetched = await this.getTransactionSignaturesForEpoch(dapp, epoch);
    // TODO filter/map and reduce
    return fetched;
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
