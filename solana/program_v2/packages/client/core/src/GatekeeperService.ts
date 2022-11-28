import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { AnchorProvider, Program } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';

import { GatewayServiceOptions, Wallet } from './lib/types';

import { EnumMapper } from './lib/utils';
import {
  DEFAULT_PASS_SEED,
  GATEWAY_PROGRAM,
  SOLANA_MAINNET,
} from './lib/constants';
import {
  ServiceBuilder,
  AbstractService,
  NonSigningWallet,
} from './utils/AbstractService';
import { ExtendedCluster, getConnectionByCluster } from './lib/connection';
import { PassAccount, PassState, PassStateMapping } from './lib/wrappers';

/**
 * The GatekeeperService is responsible for creating and managing passes within a network
 */
export class GatekeeperService extends AbstractService {
  private constructor(
    _program: Program<SolanaAnchorGateway>,
    private _network: PublicKey,
    private _gatekeeper: PublicKey,
    _cluster: ExtendedCluster = SOLANA_MAINNET,
    _wallet: Wallet = new NonSigningWallet(),
    _opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {
    super(_program, _cluster, _wallet, _opts);
  }

  /**
   * Builds and returns an instance of an GatekeeperService
   *
   * @param network The network for this instance of the GatekeeperService
   * @param gatekeeper The gatekeeper account this service will be managing
   * @param options Options to override default values for the GatekeeperService
   */
  static async build(
    network: PublicKey,
    gatekeeper: PublicKey,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    }
  ): Promise<GatekeeperService> {
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

    const program = await AbstractService.fetchProgram(provider);

    return new GatekeeperService(
      program,
      network,
      gatekeeper,
      options.clusterType,
      wallet,
      provider.opts
    );
  }

  /**
   * Builds and returns an instance of an AdminService using an instance of the anchor program
   *
   * @param program The Anchor program to build the GatekeeperService instance from
   * @param network The network this GatekeeperService operates in
   * @param gatekeeper The gatekeeper the service is created for
   * @param options Options to override default values for the GatekeeperService
   * @param provider The anchor provider to use (defaults to the provider from the program)
   */
  static async buildFromAnchor(
    program: Program<SolanaAnchorGateway>,
    network: PublicKey,
    gatekeeper: PublicKey,
    options: GatewayServiceOptions = {
      clusterType: SOLANA_MAINNET,
    },
    provider: AnchorProvider = program.provider as AnchorProvider
  ): Promise<GatekeeperService> {
    const wallet = options.wallet || new NonSigningWallet();

    return new GatekeeperService(
      program,
      network,
      gatekeeper,
      options.clusterType,
      wallet,
      provider.opts
    );
  }

  /**
   * Creates the PDA for the pass
   *
   * @param subject The subject (public key) for account the pass is issued to
   * @param network The network this pass is issued to (TODO: Should this not default to the network provided on build)
   * @param pass_number The pass number (to allow multiple passes to a subject in a network)
   */
  static async createPassAddress(
    subject: PublicKey,
    network: PublicKey,
    pass_number = 0
  ): Promise<PublicKey> {
    const pass_number_buffer = Buffer.alloc(2);
    pass_number_buffer.writeInt16LE(pass_number);

    const [address] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(DEFAULT_PASS_SEED),
        subject.toBuffer(),
        network.toBuffer(),
        pass_number_buffer,
      ],
      GATEWAY_PROGRAM
    );

    return address;
  }

  /**
   * Issues a pass to the provided subject
   *
   * @param passAccount The PDA for the pass
   * @param subject The subject (account) the pass is issued to
   * @param passNumber The pass number to allow for multiple passes in a network
   * @param authority The authority creating the account
   * @param payer The fee payer for crating the pass
   */
  issue(
    passAccount: PublicKey,
    subject: PublicKey,
    passNumber = 0,
    authority: PublicKey = this.getWallet().publicKey,
    payer = authority
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.issuePass(subject, passNumber)
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        payer,
        authority,
        network: this._network,
        gatekeeper: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Sets the state on a pass
   *
   * @param state The state of the pass
   * @param passAccount The PDA for the pass
   * @param authority The gatekeeper authority for setting the pass
   */
  setState(
    state: PassState,
    passAccount: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.setPassState(EnumMapper.to(state, PassStateMapping))
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
        gatekeeper: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Refreshes a pass by updating the date it was issued so that is can be reused past expiry
   *
   * @param passAccount The ODA for the pass
   * @param authority The gatekeeper authority for setting the pass state
   */
  refreshPass(
    passAccount: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.refreshPass()
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
        gatekeeper: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Expires a pass so that it can no longer be used
   *
   * @param passAccount The PDA for the pass
   * @param authority The gatekeeper authority for expiring a pass
   */
  expirePass(
    passAccount: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.expirePass()
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
        gatekeeper: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Calls an on-chain instruction to verify a pass is active and not expired.
   *
   * @param passAccount The PDA for the pass to verify
   * @param authority The gatekeeper authority for verifying a pass (TODO: do we need this as it is "public info")
   */
  verifyPass(
    passAccount: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.verifyPass()
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Changes the gatekeeper for a pass (this has to be a gatekeeper within the same network)
   *
   * @param gatekeeper The new gatekeeper for the pass
   * @param passAccount The PDA for the pass
   * @param authority The gatekeeper authority able to change a gatekeeper
   */
  changePassGatekeeper(
    gatekeeper: PublicKey | undefined,
    passAccount: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.changePassGatekeeper()
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
        newGatekeeper: gatekeeper,
        oldGatekeeper: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Sets network/gatekeeper specific data for a pass
   *
   * @param passAccount The PDA for the pass
   * @param gatekeeperData
   * @param networkData
   * @param authority
   */
  setPassData(
    passAccount: PublicKey,
    gatekeeperData: Uint8Array | null,
    networkData: Uint8Array | null,
    authority: PublicKey = this._wallet.publicKey
  ): ServiceBuilder {
    // CHECK: Could/Should we pad with 0's automatically if less than 32 bytes?
    if (
      (gatekeeperData && gatekeeperData.length !== 32) ||
      (networkData && networkData.length !== 32)
    ) {
      throw new Error('Data provided needs to be 32 bytes');
    }

    const instructionPromise = this.getProgram()
      .methods.setPassData(gatekeeperData, networkData)
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        gatekeeper: this._gatekeeper,
      })
      .instruction();

    return new ServiceBuilder(this, {
      instructionPromise,
      authority,
    });
  }

  /**
   * Looks up the on-chain state of a pass
   *
   * @param subject The subject (account owner) for the pass
   * @param passNumber The pass number if more than one pass exists in the network for the same subject
   */
  async getPassAccount(
    subject: PublicKey,
    passNumber = 0
  ): Promise<PassAccount | null> {
    const account = await GatekeeperService.createPassAddress(
      subject,
      this._network,
      passNumber
    );
    return (
      this.getProgram()
        .account.pass.fetchNullable(account)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        .then(PassAccount.from)
    );
  }

  /**
   * Returns the gatekeeper the service was built with
   */
  getGatekeeper(): PublicKey {
    return this._gatekeeper;
  }

  /**
   * Returns the network the service was built with
   */
  getNetwork(): PublicKey {
    return this._network;
  }
}
