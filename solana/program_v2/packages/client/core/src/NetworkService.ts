import * as anchor from '@project-serum/anchor';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  AuthKeyStructure,
  CreateGatekeeperData,
  UpdateGatekeeperData,
  GatewayServiceOptions,
  FeeStructure,
  Wallet,
  GatekeeperAccount,
  GatekeeperState,
  GatekeeperStateMapping,
} from './lib/types';
import { ExtendedCluster, getConnectionByCluster } from './lib/connection';
import { EnumMapper } from './lib/utils';
import {
  GatekeeperKeyFlags,
  GATEKEEPER_SEED,
  GATEWAY_PROGRAM,
  SOLANA_MAINNET,
} from './lib/constants';
import { GatewayV2 } from '@identity.com/gateway-solana-idl';
import {
  AbstractService,
  NonSigningWallet,
  ServiceBuilder,
} from './utils/AbstractService';

// Service for a network. This will handle all aspects of the Gateway that a network is able to control... i.e. creating gatekeepers, updating gatekeepers, etc...
export class NetworkService extends AbstractService {
  constructor(
    program: Program<GatewayV2>,
    private _gatekeeper: PublicKey,
    private _gatekeeperAccount: PublicKey,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    wallet: Wallet = new NonSigningWallet(),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    super(program, cluster, wallet, opts);
  }

  static async build(
    gatekeeper: PublicKey,
    dataAccount: PublicKey,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    }
  ): Promise<NetworkService> {
    const wallet = options.wallet || new NonSigningWallet();
    const confirmOptions =
      options.confirmOptions || AnchorProvider.defaultOptions();
    const _connection =
      options.connection ||
      getConnectionByCluster(
        options.clusterType,
        confirmOptions.preflightCommitment
      );

    const provider = new AnchorProvider(_connection, wallet, confirmOptions);

    const program = await NetworkService.fetchProgram(provider);

    return new NetworkService(
      program,
      gatekeeper,
      dataAccount,
      options.clusterType,
      wallet,
      provider.opts
    );
  }

  static async buildFromAnchor(
    program: Program<GatewayV2>,
    gatekeeper: PublicKey,
    gatekeeperAccount: PublicKey,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    },
    provider: AnchorProvider = program.provider as AnchorProvider
  ): Promise<NetworkService> {
    const wallet = options.wallet || new NonSigningWallet();

    return new NetworkService(
      program,
      gatekeeper,
      gatekeeperAccount,
      options.clusterType,
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

  //TODO! seeds derivation program side
  static async createStakingAddress(
    network: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode('gw-stake'), network.toBuffer()],
      GATEWAY_PROGRAM
    );
  }

  // Creates a gatekeeper on a specified network
  // @authThreshold
  createGatekeeper(
    network: PublicKey,
    stakingAccount: PublicKey,
    payer: PublicKey = this._wallet.publicKey,
    data: CreateGatekeeperData = {
      tokenFees: [],
      authThreshold: 1,
      authKeys: [
        {
          flags: GatekeeperKeyFlags.AUTH,
          key: this._gatekeeper,
        },
      ],
    },
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .createGatekeeper({
        tokenFees: data.tokenFees,
        authThreshold: data.authThreshold,
        authKeys: data.authKeys,
      })
      .accounts({
        gatekeeper: this._gatekeeperAccount,
        authority,
        network,
        stakingAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        payer,
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
    stakingAccount: PublicKey,
    payer: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      // anchor IDL does not work with nested types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .updateGatekeeper({
        authThreshold: data.authThreshold,
        tokenFees: data.tokenFees,
        authKeys: data.authKeys,
      })
      .accounts({
        gatekeeper: this._gatekeeperAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        stakingAccount,
        payer,
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
    network: PublicKey,
    destination: PublicKey = this._wallet.publicKey,
    payer: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      //anchor IDL does not work with nested types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .closeGatekeeper()
      .accounts({
        gatekeeper: this._gatekeeperAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        destination,
        authority,
        network,
        payer,
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
        gatekeeper: this._gatekeeperAccount,
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
      .gatekeeperWithdraw()
      .accounts({
        gatekeeper: this._gatekeeperAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        receiver,
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
    account: PublicKey = this._gatekeeperAccount
  ): Promise<GatekeeperAccount | null> {
    const gatekeeperAccount = this._program.account.gatekeeper
      .fetchNullable(account)
      .then((acct) => {
        if (acct) {
          return {
            version: acct?.version,
            authority: acct?.authority,
            gatekeeperNetwork: acct?.gatekeeperNetwork,
            stakingAccount: acct?.stakingAccount,
            tokenFees: acct?.tokenFees as FeeStructure[],
            authKeys: acct?.authKeys as AuthKeyStructure[],
            state: acct?.gatekeeperState as GatekeeperState,
          };
        } else {
          return null;
        }
      });
    return gatekeeperAccount;
  }

  getGatekeeperAddress(): PublicKey {
    return this._gatekeeperAccount;
  }
}
