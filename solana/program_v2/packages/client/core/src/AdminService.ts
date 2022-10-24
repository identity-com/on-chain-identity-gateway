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

import {
  CustomClusterUrlConfig,
  ExtendedCluster,
  getConnectionByCluster,
} from './lib/connection';
import { NETWORK_SEED, GATEWAY_PROGRAM, SOLANA_MAINNET } from './lib/constants';
import { GatewayV2 } from '@identity.com/gateway-solana-idl';
import {
  AbstractService,
  NonSigningWallet,
  ServiceBuilder,
} from './utils/AbstractService';

export class AdminService extends AbstractService {
  static async build(
    dataAccount: PublicKey,
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
      dataAccount,
      options.clusterType,
      provider.wallet,
      provider.opts
    );
  }

  static async buildFromAnchor(
    program: Program<GatewayV2>,
    dataAccount: PublicKey,
    provider: AnchorProvider = program.provider as AnchorProvider,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    },
    wallet: Wallet = provider.wallet
  ): Promise<AdminService> {
    return new AdminService(
      program,
      dataAccount,
      options.clusterType,
      wallet ? wallet : provider.wallet,
      provider.opts
    );
  }

  static async createNetworkAddress(
    authority: PublicKey,
    networkIndex = 0
  ): Promise<[PublicKey, number]> {
    const network_index_buffer = Buffer.alloc(2);
    network_index_buffer.writeInt16LE(networkIndex);

    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(NETWORK_SEED),
        authority.toBuffer(),
        network_index_buffer,
      ],
      GATEWAY_PROGRAM
    );
  }

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
        gatekeepers: data.gatekeepers,
        supportedTokens: data.supportedTokens,
        networkFeatures: data.networkFeatures,
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

  async getNetworkAccount(
    account: PublicKey = this._dataAccount as PublicKey // TODO: Update this once the interface has changed
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
