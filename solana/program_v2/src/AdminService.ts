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
import { SOLANA_MAINNET } from './lib/constants';
import { GatewayV2 } from '../target/types/gateway_v2';
import { AbstractService, ServiceBuilder } from './utils/AbstractService';

// admin service for managing networks (creating, closing, updating) on gateway program v2 (Anchor implementation)
export class AdminService extends AbstractService {
  // @dataAccount - the network account
  // @wallet - the wallet that will be used to sign the transaction
  // @cluster - the cluster that the network account is on
  // @customConfig - custom cluster url config
  // @opts - transaction options
  static async build(
    dataAccount: PublicKey,
    wallet: Wallet,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    customConfig?: CustomClusterUrlConfig,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): Promise<AdminService> {
    // connect to the cluster (testnet, localnet, devnet, mainnet), at the momenet we are connecting to the localnet
    const _connection = getConnectionByCluster(
      cluster,
      opts.preflightCommitment,
      customConfig
    );
    // provider is the wallet that will be used to sign the transaction
    const provider = new AnchorProvider(_connection, wallet, opts);
    // fetches the program id from the cluster
    const program = await AdminService.fetchProgram(provider);
    return new AdminService(
      program,
      dataAccount,
      cluster,
      wallet,
      provider.opts
    );
  }
  //builds a transaction that will create a new network

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
  // let admin to create a new network and return the new network account
  static async createNetworkAddress(
    authority: PublicKey
  ): Promise<[PublicKey, number]> {
    return findProgramAddress('gk-network', authority);
  }
  //gives admin an authority to close network
  closeNetwork(
    destination: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .closeNetwork()
      .accounts({
        network: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
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
  //gives admin an authority to create a network
  createNetwork(
    data: CreateNetworkData = {
      authThreshold: 1,
      passExpireTime: 16,
      signerBump: 0,
      fees: [],
      authKeys: [{ flags: 4097, key: this._wallet.publicKey }],
    },
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .createNetwork({
        authThreshold: data.authThreshold,
        passExpireTime: new anchor.BN(data.passExpireTime),
        fees: data.fees,
        authKeys: data.authKeys,
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
  //gives admin an authority to update a network
  //
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
  //let admin to grab the network account data from the network account
  async getNetworkAccount(
    account: PublicKey = this._dataAccount
  ): Promise<NetworkAccount | null> {
    const networkAccount = this._program.account.gatekeeperNetwork
      .fetchNullable(account)
      .then((acct) => {
        if (acct) {
          return {
            version: acct?.version,
            initialAuthority: acct?.initialAuthority,
            authThreshold: acct?.authThreshold,
            passExpireTime: acct?.passExpireTime.toNumber(),
            fees: acct?.fees as FeeStructure[],
            authKeys: acct?.authKeys as AuthKeyStructure[],
          };
        } else {
          return null;
        }
      });
    return networkAccount;
  }
}
