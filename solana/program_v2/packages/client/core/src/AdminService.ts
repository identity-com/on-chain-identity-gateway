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
import { SOLANA_MAINNET } from './lib/constants';
import { GatewayV2 } from '@identity.com/gateway-solana-idl';
import {
  AbstractService,
  NonSigningWallet,
  ServiceBuilder,
} from './utils/AbstractService';

export class AdminService extends AbstractService {
  constructor(
    program: Program<GatewayV2>,
    private _network: PublicKey,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    wallet: Wallet = new NonSigningWallet(),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    super(program, undefined, cluster, wallet, opts);
  }

  static async build(
    network: PublicKey,
    wallet: Wallet,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    customConfig?: CustomClusterUrlConfig,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): Promise<AdminService> {
    const _connection = getConnectionByCluster(
      cluster,
      opts.preflightCommitment,
      customConfig
    );

    const provider = new AnchorProvider(_connection, wallet, opts);

    const program = await AdminService.fetchProgram(provider);

    return new AdminService(program, network, cluster, wallet, provider.opts);
  }

  static async buildFromAnchor(
    program: Program<GatewayV2>,
    network: PublicKey,
    cluster: ExtendedCluster,
    provider: AnchorProvider = program.provider as AnchorProvider,
    wallet: Wallet = provider.wallet
  ): Promise<AdminService> {
    return new AdminService(program, network, cluster, wallet, provider.opts);
  }

  closeNetwork(
    destination: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .closeNetwork()
      .accounts({
        network: this._network,
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
        network: this._network,
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
    account: PublicKey = this._network
  ): Promise<NetworkAccount | null> {
    const networkAccount = this._program.account.gatekeeperNetwork
      .fetchNullable(account)
      .then((acct) => {
        if (!acct) return null;

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
      });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return networkAccount;
  }
}
