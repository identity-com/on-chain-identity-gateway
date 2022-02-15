import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  addFeatureToNetwork,
  addGatekeeper,
  featureExists,
  getFeatureAccountAddress,
  getGatekeeperAccountAddress,
  NetworkFeature,
  removeFeatureFromNetwork,
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

  /**
   * Add Network Feature to Network
   * @param feature
   */
  async addNetworkFeature(
    hashOrNonce: HashOrNonce,
    feature: NetworkFeature,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<PublicKey>> {
    const instruction = await addFeatureToNetwork(
      this.payer.publicKey,
      this.gatekeeperNetwork.publicKey,
      feature
    );
    const transaction = new Transaction().add(instruction);

    return new SendableTransaction(this.connection, transaction)
      .withData(() =>
        getFeatureAccountAddress(feature, this.gatekeeperNetwork.publicKey)
      )
      .feePayer(feePayer ? feePayer : this.gatekeeperNetwork.publicKey)
      .addHashOrNonce(hashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperNetwork));
  }

  /**
   * Add Network Feature to Network
   * @param feature
   */
  async removeNetworkFeature(
    hashOrNonce: HashOrNonce,
    feature: NetworkFeature,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<PublicKey>> {
    const transaction = new Transaction().add(
      await removeFeatureFromNetwork(
        this.payer.publicKey,
        this.gatekeeperNetwork.publicKey,
        feature
      )
    );

    return new SendableTransaction(this.connection, transaction)
      .withData(() =>
        getFeatureAccountAddress(feature, this.gatekeeperNetwork.publicKey)
      )
      .feePayer(feePayer ? feePayer : this.gatekeeperNetwork.publicKey)
      .addHashOrNonce(hashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperNetwork));
  }

  /**
   * Check if the feature is set for the network
   * @param feature
   */
  async hasNetworkFeature(feature: NetworkFeature): Promise<boolean> {
    return featureExists(
      this.connection,
      feature,
      this.gatekeeperNetwork.publicKey
    );
  }
}
