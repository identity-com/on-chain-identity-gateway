import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  addGatekeeper,
  getGatekeeperAccountAddress,
  revokeGatekeeper,
} from "@identity.com/solana-gateway-ts";
import { SendableDataTransaction, SendableTransaction } from "../util";
import { HashOrNonce } from "../util/connection";
import {
  getOrCreateBlockhashOrNonce,
  TransactionOptions,
} from "../util/transaction";
import { SOLANA_COMMITMENT } from "../util/constants";

/**
 * Encapsulates the actions performed by a gatekeeper network authority
 */
export class GatekeeperNetworkService {
  /**
   * Construct a new gatekeeper network service
   * @param connection A solana connection object
   * @param gatekeeperNetwork The network authority's key
   */
  constructor(
    private readonly connection: Connection,
    private gatekeeperNetwork: Keypair
  ) {}

  private async optionsWithDefaults(
    options: TransactionOptions = {}
  ): Promise<Required<TransactionOptions>> {
    const defaultOptions = {
      feePayer: this.gatekeeperNetwork.publicKey,
      rentPayer: this.gatekeeperNetwork.publicKey,
      commitment: SOLANA_COMMITMENT,
      ...options,
    };

    const blockhashOrNonce = await getOrCreateBlockhashOrNonce(
      this.connection,
      defaultOptions.blockhashOrNonce
    );

    return {
      ...defaultOptions,
      blockhashOrNonce,
    };
  }

  /**
   * Add a gatekeeper to the network
   * @param gatekeeperAuthority
   * @param options
   */
  async addGatekeeper(
    gatekeeperAuthority: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<PublicKey>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const gatekeeperAccount = await getGatekeeperAccountAddress(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );

    const transaction = new Transaction().add(
      addGatekeeper(
        normalizedOptions.rentPayer,
        gatekeeperAccount,
        gatekeeperAuthority,
        this.gatekeeperNetwork.publicKey
      )
    );

    return new SendableTransaction(this.connection, transaction)
      .withData(gatekeeperAccount)
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(normalizedOptions.blockhashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperNetwork));
  }

  async revokeGatekeeper(
    gatekeeperAuthority: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<PublicKey>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const gatekeeperAccount = await getGatekeeperAccountAddress(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );

    const transaction = new Transaction().add(
      revokeGatekeeper(
        normalizedOptions.rentPayer,
        gatekeeperAccount,
        gatekeeperAuthority,
        this.gatekeeperNetwork.publicKey
      )
    );

    return new SendableTransaction(this.connection, transaction)
      .withData(gatekeeperAccount)
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(normalizedOptions.blockhashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperNetwork));
  }

  /**
   * Check if the gatekeeper already belongs to the network
   * @param gatekeeperAuthority
   */
  async hasGatekeeper(gatekeeperAuthority: PublicKey): Promise<boolean> {
    const gatekeeperAccount = await getGatekeeperAccountAddress(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return !!gatekeeperAccountInfo;
  }
}
