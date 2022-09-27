import * as anchor from '@project-serum/anchor';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  AuthKeyStructure,
  CreateGatekeeperData,
  UpdateGatekeeperData,
  FeeStructure,
  Wallet,
  GatekeeperAccount,
  GatekeeperState,
  GatekeeperStateMapping,
} from './lib/types';
import {
  CustomClusterUrlConfig,
  ExtendedCluster,
  getConnectionByCluster,
} from './lib/connection';
import { EnumMapper } from './lib/utils';
import {
  GatekeeperKeyFlags,
  GATEKEEPER_SEED,
  GATEWAY_PROGRAM,
  SOLANA_MAINNET,
} from './lib/constants';
import { AbstractService, ServiceBuilder } from './utils/AbstractService';
import { GatewayV2 } from '../target/types/gateway_v2';

// Service for a network. This will handle all aspects of the Gateway that a network is able to control... i.e. creating gatekeepers, updating gatekeepers, etc...
export class NetworkService extends AbstractService {
  static async build(
    dataAccount: PublicKey,
    wallet: Wallet,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    customConfig?: CustomClusterUrlConfig,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): Promise<NetworkService> {
    const _connection = getConnectionByCluster(
      cluster,
      opts.preflightCommitment,
      customConfig
    );

    const provider = new AnchorProvider(_connection, wallet, opts);

    const program = await NetworkService.fetchProgram(provider);

    return new NetworkService(
      program,
      dataAccount,
      cluster,
      wallet,
      provider.opts
    );
  }

  static async buildFromAnchor(
    program: Program<GatewayV2>,
    dataAccount: PublicKey,
    cluster: ExtendedCluster,
    provider: AnchorProvider = program.provider as AnchorProvider,
    wallet: Wallet = provider.wallet
  ): Promise<NetworkService> {
    return new NetworkService(
      program,
      dataAccount,
      cluster,
      wallet,
      provider.opts
    );
  }

  // Creates a gatekeeper's public key from a given seed and authority.
  static async createGatekeeperAddress(
    authority: PublicKey,
    network: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(GATEKEEPER_SEED),
        authority.toBuffer(),
        network.toBuffer(),
      ],
      GATEWAY_PROGRAM
    );
  }

  // Creates a gatekeeper on a specified network
  // @authThreshold
  createGatekeeper(
    network: PublicKey,
    data: CreateGatekeeperData = {
      authThreshold: 1,
      signerBump: 0,
      authKeys: [
        {
          flags: GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.SET_EXPIRE_TIME,
          key: this._wallet.publicKey,
        },
      ],
      gatekeeperNetwork: network,
      addresses: this._wallet.publicKey,
      stakingAccount: this._wallet.publicKey,
      fees: [],
    },
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .createGatekeeper({
        authThreshold: data.authThreshold,
        signerBump: data.signerBump,
        authKeys: data.authKeys,
        gatekeeperNetwork: data.gatekeeperNetwork,
        addresses: data.addresses,
        stakingAccount: data.stakingAccount,
        fees: data.fees,
      })
      .accounts({
        gatekeeper: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
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

  // Allows a network to update a gatekeeper's data
  updateGatekeeper(
    data: UpdateGatekeeperData,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      // @ts-ignore
      .updateGatekeeper({
        authThreshold: data.authThreshold,
        gatekeeperNetwork: data.gatekeeperNetwork,
        addresses: data.addresses,
        stakingAccount: data.stakingAccount,
        fees: data.fees,
        authKeys: data.authKeys,
      })
      .accounts({
        gatekeeper: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
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

  // Closes a gatekeeper on a network
  closeGatekeeper(
    destination: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      // @ts-ignore
      .closeGatekeeper()
      .accounts({
        gatekeeper: this._dataAccount,
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

  // Allows an authority to update the state of a gatekeeper (Active, Frozen, Halted)
  setGatekeeperState(
    state: GatekeeperState = GatekeeperState.Active,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .setGatekeeperState(EnumMapper.to(state, GatekeeperStateMapping))
      .accounts({
        gatekeeper: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
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

  // Controls withdrawal of funds from a gatekeeper
  gatekeeperWithdraw(
    receiver: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .gatekeeperWithdraw(receiver)
      .accounts({
        gatekeeper: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
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

  // Retrieves a gatekeeper's information
  async getGatekeeperAccount(
    account: PublicKey = this._dataAccount
  ): Promise<GatekeeperAccount | null> {
    const gatekeeperAccount = this._program.account.gatekeeper
      .fetchNullable(account)
      .then((acct) => {
        if (acct) {
          return {
            version: acct?.version,
            gatekeeperNetwork: acct?.gatekeeperNetwork,
            fees: acct?.fees as FeeStructure[],
            authKeys: acct?.authKeys as AuthKeyStructure[],
            state: acct?.gatekeeperState as GatekeeperState,
          };
        } else {
          return null;
        }
      });
    return gatekeeperAccount;
  }
}
