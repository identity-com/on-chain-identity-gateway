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
  // eslint-disable-next-line no-useless-constructor
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
   * @param gatekeeperAuthority PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<PublicKey>>
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
   * @param gatekeeperAuthority PublicKey
   *
   * @returns Promise<boolean>
   */
  async hasGatekeeper(gatekeeperAuthority: PublicKey): Promise<boolean> {
    const gatekeeperAccount = await getGatekeeperAccountAddress(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return Boolean(gatekeeperAccountInfo);
  }

  /**
   * Add Network Feature to Network
   * @param hashOrNonce HashOrNonce
   * @param feature NetworkFeature
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<PublicKey>>
   */
  async addNetworkFeature(
    hashOrNonce: HashOrNonce,
    feature: NetworkFeature,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<PublicKey>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const instruction = await addFeatureToNetwork(
      normalizedOptions.rentPayer,
      this.gatekeeperNetwork.publicKey,
      feature
    );
    const transaction = new Transaction().add(instruction);

    return new SendableTransaction(this.connection, transaction)
      .withData(() =>
        getFeatureAccountAddress(feature, this.gatekeeperNetwork.publicKey)
      )
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(normalizedOptions.blockhashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperNetwork));
  }

  /**
   * Remove Network Feature from Network
   * @param hashOrNonce HashOrNonce
   * @param feature NetworkFeature
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<PublicKey>>
   */
  async removeNetworkFeature(
    hashOrNonce: HashOrNonce,
    feature: NetworkFeature,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<PublicKey>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const transaction = new Transaction().add(
      await removeFeatureFromNetwork(
        normalizedOptions.rentPayer,
        this.gatekeeperNetwork.publicKey,
        feature
      )
    );

    return new SendableTransaction(this.connection, transaction)
      .withData(() =>
        getFeatureAccountAddress(feature, this.gatekeeperNetwork.publicKey)
      )
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(normalizedOptions.blockhashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperNetwork));
  }

  /**
   * Check if the feature is set for the network
   * @param feature NetworkFeature
   *
   * @returns Promise<boolean>
   */
  async hasNetworkFeature(feature: NetworkFeature): Promise<boolean> {
    return featureExists(
      this.connection,
      feature,
      this.gatekeeperNetwork.publicKey
    );
  }
}

export class SimpleGatekeeperNetworkService {
  gns: GatekeeperNetworkService;
  /**
   * Simpler version of the GatekeeperNetworkService class. The functions in here send and confirm the results from those in GatekeeperNetworkService, returning a PublicKey rather than a SendableDataTransaction
   * @param connection Connection
   * @param gatekeeperNetwork Keypair
   */
  constructor(connection: Connection, gatekeeperNetwork: Keypair) {
    this.gns = new GatekeeperNetworkService(connection, gatekeeperNetwork);
  }

  /**
   * Sends and Confirms results from the GatekeeperNetworkService "addGatekeeper" function
   * @param gatekeeperAuthority PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<PublicKey | null>
   */
  async addGatekeeper(
    gatekeeperAuthority: PublicKey,
    options?: TransactionOptions
  ): Promise<PublicKey | null> {
    return this.gns
      .addGatekeeper(gatekeeperAuthority, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperNetworkService "revokeGatekeeper" function
   * @param gatekeeperAuthority PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<PublicKey | null>
   */
  async revokeGatekeeper(
    gatekeeperAuthority: PublicKey,
    options?: TransactionOptions
  ): Promise<PublicKey | null> {
    return this.gns
      .revokeGatekeeper(gatekeeperAuthority, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperNetworkService "addNetworkFeature" function
   * @param hashOrNonce HashOrNonce
   * @param feature NetworkFeature
   * @param options TransactionOptions
   *
   * @returns Promise<PublicKey | null>
   */
  async addNetworkFeature(
    hashOrNonce: HashOrNonce,
    feature: NetworkFeature,
    options?: TransactionOptions
  ): Promise<PublicKey | null> {
    return this.gns
      .addNetworkFeature(hashOrNonce, feature, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperNetworkService "removeNetworkFeature" function
   * @param hashOrNonce HashOrNonce
   * @param feature NetworkFeature
   * @param options TransactionOptions
   *
   * @returns Promise<PublicKey | null>
   */
  async removeNetworkFeature(
    hashOrNonce: HashOrNonce,
    feature: NetworkFeature,
    options?: TransactionOptions
  ): Promise<PublicKey | null> {
    return this.gns
      .removeNetworkFeature(hashOrNonce, feature, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }
}
