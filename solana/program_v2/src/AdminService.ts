import { AnchorProvider, Program } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';

import {
  AuthKeyStructure,
  CreateNetworkData,
  FeeStructure,
  NetworkAccount,
  UpdateNetworkData,
  Wallet,
} from './lib/types';

import {
  CustomClusterUrlConfig,
  ExtendedCluster,
  getConnectionByCluster,
} from './lib/connection';
import { findProgramAddress } from './lib/utils';
import {
  DEFAULT_SEED_STRING,
  GATEWAY_PROGRAM,
  SOLANA_MAINNET,
} from './lib/constants';
import { GatewayV2, IDL } from '../target/types/gateway_v2';
import { AbstractService, ServiceBuilder } from './utils/AbstractService';

/**
 * @class AdminService - Anchor implementation of admin service for managing networks on gateway program v2
 * @extends AbstractService - Abstract class that provides common functionality for all services
 * service for a admin. This will handle all aspects of the Gateway that a admin is able to control... i.e. creating, closing, and updating network, etc...
 */

export class AdminService extends AbstractService {
  /**
   * @param dataAccount - the network account
   * @param wallet - the wallet that will be used to sign the transaction
   * @param cluster - the cluster that the network account is on (default: mainnet, option: devnet, testnet, localnet)
   * @param customConfig - custom cluster url config
   * @param opts - transaction options
   * */
  static async build(
    dataAccount: PublicKey,
    wallet: Wallet,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    customConfig?: CustomClusterUrlConfig,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): Promise<AdminService> {
    // connect to the cluster
    const _connection = getConnectionByCluster(
      cluster,
      opts.preflightCommitment,
      customConfig
    );
    // provider is the wallet that will be used to sign the transaction
    const provider = new AnchorProvider(_connection, wallet, opts);
    // fetches the program id from the cluster
    const program = await AdminService.fetchProgram(provider);
    // returns a new instance of the AdminService
    return new AdminService(
      program,
      dataAccount,
      cluster,
      wallet,
      provider.opts
    );
  }

  /**
   * @param program - gateway program v2 from anchor
   * @param dataAccount - the network account
   * @param cluster - the cluster that the network account is on
   * @param provider - the provider required to sign the transaction
   * @param wallet - the wallet that will be used to sign the transaction
   * */
  static async buildFromAnchor(
    program: Program<GatewayV2>,
    dataAccount: PublicKey,
    cluster: ExtendedCluster,
    provider: AnchorProvider = program.provider as AnchorProvider,
    wallet: Wallet = provider.wallet
  ): Promise<AdminService> {
    return new AdminService(
      program,
      dataAccount,
      cluster,
      wallet,
      provider.opts
    );
  }
  /**
   * let admin to create a new network and return the new network account
   * @param authority - the authority required to sign the transaction
   */
  static async createNetworkAddress(
    authority: PublicKey,
    networkIndex: number = 0
  ): Promise<[PublicKey, number]> {
    const network_index_buffer = Buffer.alloc(2);
    network_index_buffer.writeInt16LE(networkIndex);

    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(DEFAULT_SEED_STRING),
        authority.toBuffer(),
        network_index_buffer,
      ],
      GATEWAY_PROGRAM
    );
  }
  /**
   * let admin to close the network account
   * @param authority - the authority required to sign the transaction
   * @param destination - the destination account that will receive the lamports
   */
  closeNetwork(
    destination: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .closeNetwork()
      .accounts({
        network: this._dataAccount,
        destination,
        authority,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }
  /**
   * gives admin an authority to create a network
   * @param authThreshold - the number of auth keys required to sign the transaction
   * @param passExpireTime - the time that the password will expire
   * @param fees - the fees that will be charged for each creation
   * @param signerBump - TODO: what is this?
   * @param authKeys - the auth keys that will be used to sign the transaction
   */
  createNetwork(
    data: CreateNetworkData = {
      authThreshold: 1,
      passExpireTime: 16,
      fees: [],
      authKeys: [{ flags: 4097, key: this._wallet.publicKey }],
      networkIndex: 0,
      gatekeepers: [],
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
        networkIndex: data.networkIndex,
        gatekeepers: data.gatekeepers,
        supportedTokens: data.supportedTokens,
      })
      .accounts({
        network: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      // TODO: Implement this...
      allowsDynamicAlloc: false,
      authority,
    });
  }
  /**
   * gives admin an authority to update a network
   * @param data - the data that will be used to update the network
   * @param authority - the authority required to sign the transaction
   */
  updateNetwork(
    data: UpdateNetworkData,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      // @ts-ignore
      .updateNetwork({
        authThreshold: data.authThreshold,
        passExpireTime: new anchor.BN(data.passExpireTime),
        fees: data.fees,
        authKeys: data.authKeys,
      })
      .accounts({
        network: this._dataAccount,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }
  /**
   * let admin to grab the network account data from the network account
   * @param account - the network account
   */
  async getNetworkAccount(
    account: PublicKey = this._dataAccount
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
    // TODO: Why the ignore ?!?
    //@ts-ignore
    return networkAccount;
  }
}
