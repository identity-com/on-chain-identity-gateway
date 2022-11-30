import { AnchorProvider, Program } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';

import {
  AuthKeyStructure,
  CreateNetworkData,
  FeeStructure,
  GatewayServiceOptions,
  NetworkAccount,
  UpdateNetworkData,
  Wallet,
} from './lib/types';

import { ExtendedCluster, getConnectionByCluster } from './lib/connection';
import { SOLANA_MAINNET } from './lib/constants';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  AbstractService,
  NonSigningWallet,
  ServiceBuilder,
} from './utils/AbstractService';

/**
 * The AdminService is responsible for administrative functions for creating and managing gatekeepers within a network
 */
export class AdminService extends AbstractService {
  constructor(
    program: Program<SolanaAnchorGateway>,
    protected _network: PublicKey,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    wallet: Wallet = new NonSigningWallet(),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    super(program, cluster, wallet, opts);
  }

  /**
   * Builds and returns an instance of an AdminService
   *
   * @param network The network this AdminService will be managing
   * @param options Options to override default values for the AdminService
   */
  static async build(
    network: PublicKey,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    }
  ): Promise<AdminService> {
    const wallet = options.wallet || new NonSigningWallet();
    const confirmOptions =
      options.confirmOptions || AnchorProvider.defaultOptions();
    const _connection =
      options.connection ||
      getConnectionByCluster(
        options.clusterType,
        confirmOptions.preflightCommitment,
        options.customConfig
      );

    const provider = new AnchorProvider(_connection, wallet, confirmOptions);

    const program = await AdminService.fetchProgram(provider);

    return new AdminService(
      program,
      network,
      options.clusterType,
      wallet,
      provider.opts
    );
  }

  /**
   * Builds and returns an instance of an AdminService using an instance of the anchor program
   *
   * @param program The Anchor program to build the AdminService instance from
   * @param network The network this AdminService will be managing
   * @param options Options to override default values for the AdminService
   * @param provider The anchor provider to use (defaults to the provider from the program)
   */
  static async buildFromAnchor(
    program: Program<SolanaAnchorGateway>,
    network: PublicKey,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    },
    provider: AnchorProvider = program.provider as AnchorProvider
  ): Promise<AdminService> {
    const wallet = options.wallet || new NonSigningWallet();

    return new AdminService(
      program,
      network,
      options.clusterType,
      wallet,
      provider.opts
    );
  }

  /**
   * Closes a network (deletes it on-chain)
   *
   * @param receiver The receiving account that rent is returned to
   * @param authority The authority for closing the network account. The authority needs to be loaded on the auth keys
   *                  for the network
   */
  closeNetwork(
    receiver: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .closeNetwork()
      .accounts({
        network: this._network,
        destination: receiver, // TODO: Rename to receiver on the program
        authority,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Creates the network the AdminService was build for
   *
   * @param data Initial data to create the etwork with
   * @param authority The initial authority for creating the account
   */
  createNetwork(
    data: CreateNetworkData = {
      authThreshold: 1,
      passExpireTime: 16,
      fees: [],
      authKeys: [{ flags: 4097, key: this._network }],
      supportedTokens: [],
    },
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .createNetwork({
        authThreshold: data.authThreshold,
        passExpireTime: new anchor.BN(data.passExpireTime),
        fees: data.fees,
        authKeys: data.authKeys,
        supportedTokens: data.supportedTokens,
      })
      .accounts({
        network: this._network,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Updates the network configuration
   *
   * @param data The data required for updating the network
   * @param authority A valid authority required for managing the network
   */
  updateNetwork(
    data: UpdateNetworkData,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .updateNetwork({
        authThreshold: data.authThreshold,
        passExpireTime: new anchor.BN(data.passExpireTime),
        fees: data.fees,
        authKeys: data.authKeys,
        supportedTokens: data.supportedTokens,
        networkFeatures: data.networkFeatures,
      })
      .accounts({
        network: this._network,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Looks up and returns a network account as it exists on chain.
   *
   * @param account An optional network account to lookup if looking up a different network account than the one
   *                specified on the builder.
   */
  async getNetworkAccount(
    account: PublicKey = this._network
  ): Promise<NetworkAccount | null> {
    const networkAccount = this._program.account.gatekeeperNetwork
      .fetchNullable(account)
      .then((acct) => {
        if (acct) {
          return {
            version: acct?.version,
            authority: acct?.authority,
            networkIndex: acct?.networkIndex,
            authThreshold: acct?.authThreshold,
            passExpireTime: acct?.passExpireTime.toNumber(),
            fees: acct?.fees as FeeStructure[],
            authKeys: acct?.authKeys as AuthKeyStructure[],
            networkFeatures: acct?.networkFeatures,
            supportedTokens: acct?.supportedTokens,
            gatekeepers: acct?.gatekeepers,
          };
        } else {
          return null;
        }
      });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return networkAccount;
  }
}
