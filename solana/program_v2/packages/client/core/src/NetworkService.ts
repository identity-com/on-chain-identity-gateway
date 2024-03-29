import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  AuthKeyStructure,
  CreateGatekeeperData,
  FeeStructure,
  GatekeeperAccount,
  GatekeeperState,
  GatekeeperStateMapping,
  GatewayServiceOptions,
  UpdateGatekeeperData,
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
    private _network: PublicKey,
    private _gatekeeper: PublicKey,
    private _gatekeeperAccount: PublicKey,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    wallet = new NonSigningWallet(),
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    super(program, cluster, wallet, opts);
  }

  /**
   * Builds an instance of the NetworkService
   *
   * @param network The network the gatekeeper exists in
   * @param gatekeeper The gatekeeper this network service manages
   * @param gatekeeperAccount The PDA for the gatekeeper
   * @param options Options to override default values for the NetworkService
   */
  static async build(
    network: PublicKey,
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
      network,
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
   * @param network The network the gatekeeper exists in
   * @param gatekeeper The gatekeeper this network service manages
   * @param gatekeeperAccount The PDA for the gatekeeper
   * @param options Options to override default values for the NetworkService
   * @param provider The anchor provider to use (defaults to the provider from the program)
   */
  static async buildFromAnchor(
    program: Program<SolanaAnchorGateway>,
    network: PublicKey,
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
      network,
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
   * @param gatekeeper The initial gatekeeper key
   * @param network The network the gatekeeper belongs to
   */
  static async createGatekeeperAddress(
    gatekeeper: PublicKey,
    network: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(GATEKEEPER_SEED),
        gatekeeper.toBuffer(),
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
   * @param stakingAccount The staking account for the gatekeeper
   * @param data The initial state to create the gatekeeper with
   * @param payer The fee payer
   * @param network_authority The authority used to create the gatekeeper
   */
  createGatekeeper(
    stakingAccount: PublicKey,
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
      supportedTokens: [],
    },
    payer: PublicKey = this._wallet.publicKey,
    network_authority: PublicKey = this._network
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      // anchor IDL does not work with nested types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .createGatekeeper({
        tokenFees: data.tokenFees.map((fee) => ({
          token: fee?.token,
          issue: new anchor.BN(fee.issue),
          expire: new anchor.BN(fee.expire),
          verify: new anchor.BN(fee.verify),
          refresh: new anchor.BN(fee.refresh),
        })),
        authThreshold: data.authThreshold,
        authKeys: data.authKeys,
      })
      .accounts({
        gatekeeper: this._gatekeeperAccount,
        authority: network_authority,
        network: this._network,
        stakingAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        payer,
        subject: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority: network_authority,
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
   * @param receiver The receiver of the rent reclaimed
   * @param payer The fee payer
   * @param network_authority the network authority required to create the gatekeeper
   */
  closeGatekeeper(
    receiver: PublicKey = this._network,
    payer: PublicKey = this._wallet.publicKey,
    network_authority: PublicKey = this._network
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
        authority: network_authority,
        network: this._network,
        payer,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority: network_authority,
    });
  }

  /**
   * Changes the gatekeeper state
   *
   * @param state The new state for the gatekeeper
   * @param network_authority An authority allowed to change gatekeeper state
   */
  setGatekeeperState(
    state: GatekeeperState = GatekeeperState.Active,
    network_authority: PublicKey = this._network
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .setGatekeeperState(EnumMapper.to(state, GatekeeperStateMapping))
      .accounts({
        gatekeeper: this._gatekeeperAccount,
        authority: network_authority,
        network: this._network,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority: network_authority,
    });
  }

  gatekeeperWithdraw(
    gatekeeper: PublicKey,
    authority: PublicKey = this._wallet.publicKey,
    splTokenProgram: PublicKey,
    mint: PublicKey,
    receiverTokenAccount: PublicKey,
    gatekeeperTokenAccount: PublicKey,
    amount: number
  ): ServiceBuilder {
    const instructionPromise = this._program.methods
      .gatekeeperWithdraw(new anchor.BN(amount))
      .accounts({
        gatekeeper,
        authority,
        splTokenProgram,
        mint,
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
            tokenFees: acct?.tokenFees as unknown as FeeStructure[],
            authKeys: acct?.authKeys as AuthKeyStructure[],
            state: acct?.gatekeeperState as unknown as GatekeeperState,
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
