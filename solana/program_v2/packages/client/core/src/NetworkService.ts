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
  GATEKEEPER_SEED,
  GATEWAY_PROGRAM,
  SOLANA_MAINNET,
} from './lib/constants';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  AbstractService,
  NonSigningWallet,
  ServiceBuilder,
} from './utils/AbstractService';

/**
 * The NetworkService is used to manage gatekeepers within a network
 */
export class NetworkService extends AbstractService {
  constructor(
    program: Program<SolanaAnchorGateway>,
    private _gatekeeper: PublicKey,
    private _gatekeeperAccount: PublicKey,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    wallet: Wallet = new NonSigningWallet(),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    super(program, cluster, wallet, opts);
  }

  /**
   * Builds an instance of the NetworkService
   *
   * @param gatekeeper The gatekeeper this network service manages
   * @param gatekeeperAccount The PDA for the gatekeeper
   * @param options Options to override default values for the NetworkService
   */
  static async build(
    gatekeeper: PublicKey,
    gatekeeperAccount: PublicKey,
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
        confirmOptions.preflightCommitment,
        options.customConfig
      );

    const provider = new AnchorProvider(_connection, wallet, confirmOptions);

    const program = await NetworkService.fetchProgram(provider);

    return new NetworkService(
      program,
      gatekeeper,
      gatekeeperAccount,
      options.clusterType,
      wallet,
      provider.opts
    );
  }

  /**
   * Builds and returns an instance of an NetworkService using an instance of the anchor program
   *
   * @param program The Anchor program to build the GatekeeperService instance from
   * @param gatekeeper The gatekeeper this network service manages
   * @param gatekeeperAccount The PDA for the gatekeeper
   * @param options Options to override default values for the NetworkService
   * @param provider The anchor provider to use (defaults to the provider from the program)
   */
  static async buildFromAnchor(
    program: Program<SolanaAnchorGateway>,
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

  /**
   * Creates the gatekeeper PDA
   *
   * @param authority The initial gatekeeper authority
   * @param network The network the gatekeeper belongs to
   */
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

  /**
   * Creates a gatekeeper within the network
   *
   * @param network The network to create the gatekeeper account in (TODO: should this default to the network provided on build)
   * @param stakingAccount The staking account for the gatekeeper
   * @param payer The fee payer
   * @param data The initial state to create the gatekeeper with
   * @param authority The authority used to create the gatekeeper
   */
  createGatekeeper(
    network: PublicKey,
    stakingAccount: PublicKey,
    payer: PublicKey = this._wallet.publicKey,
    data: CreateGatekeeperData = {
      tokenFees: [],
      authThreshold: 1,
      authKeys: [
        {
          // TODO: Set default flags to 1
          flags: 65535,
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
      authority,
    });
  }

  /**
   * Updates the gatekeeper state within the network
   *
   * @param data The new state for the gatekeeper
   * @param stakingAccount The staking account for the gatekeeper
   * @param payer The fee payer for the update in case of an account resize
   * @param authority The authority for the making the change
   */
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
        tokenFees: {
          add: data.tokenFees.add.map((fee) => ({
            token: fee?.token,
            issue: new anchor.BN(fee.issue),
            expire: new anchor.BN(fee.expire),
            verify: new anchor.BN(fee.verify),
            refresh: new anchor.BN(fee.refresh),
          })),
          remove: data.tokenFees.remove,
        },
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
      authority,
    });
  }

  /**
   * Closes a gatekeeper and claims back the rent
   *
   * @param network The network the gatekeeper is in
   * @param receiver The receiever of the rent reclaimed
   * @param payer The fee payer
   * @param authority The authority required to close the account
   */
  closeGatekeeper(
    network: PublicKey,
    receiver: PublicKey = this._wallet.publicKey,
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
        destination: receiver,
        authority,
        network,
        payer,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Changes the gatekeeper state
   *
   * @param state The new state for the gatekeeper
   * @param authority An authority allowed to change gatekeeper state
   */
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
      authority,
    });
  }

  gatekeeperWithdraw(
    gatekeeper: PublicKey,
    authority: PublicKey = this._wallet.publicKey,
    mintAccount: PublicKey,
    splTokenProgram: PublicKey,
    receiverTokenAccount: PublicKey,
    gatekeeperTokenAccount: PublicKey,
    amount: number
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .gatekeeperWithdraw(new anchor.BN(amount))
      .accounts({
        gatekeeper: gatekeeper,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        mintAccount,
        splTokenProgram,
        receiverTokenAccount,
        gatekeeperTokenAccount,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Retrieves the on-chain gatekeeper account state
   *
   * @param account The account to lookup
   */
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

  /**
   * Returns the gatekeeper address
   */
  getGatekeeperAddress(): PublicKey {
    return this._gatekeeperAccount;
  }
}
