import {
  AnchorProvider,
  Program,
  Idl,
  parseIdlErrors,
  translateError,
} from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import { SolanaAnchorGateway, IDL } from '@identity.com/gateway-solana-idl';

import { ExtendedCluster } from '../lib/connection';
import { GATEWAY_PROGRAM, SOLANA_MAINNET } from '../lib/constants';
import { Wallet } from '@coral-xyz/anchor/dist/cjs/provider';

/**
 * The AbstractService provides base functionality for other services
 */
export abstract class AbstractService {
  protected constructor(
    protected _program: Program<SolanaAnchorGateway>,
    protected _cluster: ExtendedCluster = SOLANA_MAINNET,
    protected _wallet: Wallet = new NonSigningWallet(),
    protected _opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {}

  /**
   * Fetches an instance of the Anchor Program based on the provider
   *
   * @param provider The provider to create the program from
   */
  static async fetchProgram(
    provider: anchor.Provider
  ): Promise<Program<SolanaAnchorGateway>> {
    return new Program<SolanaAnchorGateway>(
      IDL,
      GATEWAY_PROGRAM,
      provider
    ) as Program<SolanaAnchorGateway>;
  }

  /**
   * Gets the wallet used for the service
   */
  getWallet(): Wallet {
    return this._wallet;
  }

  /**
   * Gets the program used for the service
   */
  getProgram(): Program<SolanaAnchorGateway> {
    return this._program;
  }

  /**
   * Gets the connection used for the service
   */
  getConnection(): Connection {
    return this._program.provider.connection;
  }

  /**
   * Gets the solana confirm options used for the service
   */
  getConfirmOptions(): ConfirmOptions {
    return this._opts;
  }

  /**
   * Gets the IDL used for the service
   */
  getIdl(): Idl {
    return this._program.idl;
  }
}

/**
 * A non-signing wallet used if no signing functionality is required
 */
export class NonSigningWallet implements Wallet {
  publicKey: PublicKey;

  constructor() {
    this.publicKey = new PublicKey('11111111111111111111111111111111');
  }

  signAllTransactions<T extends Transaction | VersionedTransaction>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _txs: T[]
  ): Promise<T[]> {
    return Promise.reject(
      'NonSigningWallet does not support signing transactions'
    );
  }

  signTransaction<T extends Transaction | VersionedTransaction>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx: T
  ): Promise<T> {
    return Promise.reject(
      'NonSigningWallet does not support signing transactions'
    );
  }
}

/**
 * The ServiceBuilder is used to provide a builder to create and execute instructions
 */
export class ServiceBuilder {
  private wallet: Wallet;
  private connection: Connection;
  private confirmOptions: ConfirmOptions;
  private partialSigners: Signer[] = [];
  private readonly idlErrors: Map<number, string>;

  constructor(
    private service: AbstractService,
    private _instruction: BuilderInstruction,
    private authority: PublicKey = PublicKey.default
  ) {
    this.wallet = this.service.getWallet();
    this.connection = this.service.getConnection();
    this.confirmOptions = this.service.getConfirmOptions();

    this.idlErrors = parseIdlErrors(service.getIdl());
  }

  /**
   * Gets the intruction to be executed
   */
  get instruction(): BuilderInstruction {
    return this._instruction;
  }

  /**
   * Allows providing an alternative connection to be used when executing the instruction
   *
   * @param connection The connection to use
   */
  withConnection(connection: Connection): ServiceBuilder {
    this.connection = connection;
    return this;
  }

  /**
   * Allows providing an alternative confirm options to be used when executing the instruction
   *
   * @param confirmOptions The confirm options to use
   */
  withConfirmOptions(confirmOptions: ConfirmOptions): ServiceBuilder {
    this.confirmOptions = confirmOptions;
    return this;
  }

  /**
   * Allows providing an alternative wallet to be used when executing the instruction
   *
   * @param wallet The wallet to use
   */
  withWallet(wallet: Wallet): ServiceBuilder {
    this.wallet = wallet;
    return this;
  }

  /**
   * Allows providing additional signers when executing the instruction
   *
   * @param signers The signers to use
   */
  withPartialSigners(...signers: Signer[]): ServiceBuilder {
    this.partialSigners = signers;
    return this;
  }

  /**
   * Returns the transaction for the instructions
   */
  async transaction(): Promise<Transaction> {
    const tx = new Transaction();
    const instructions = await this._instruction.instructionPromise;
    tx.add(instructions);
    return tx;
  }

  /**
   * Executes the instruction this service builder was created for
   *
   * @param opts Optionally allows overriding the confirm options
   */
  async rpc(opts?: ConfirmOptions): Promise<string> {
    const provider = new AnchorProvider(
      this.connection,
      this.wallet,
      this.confirmOptions
    );

    const tx = await this.transaction();
    try {
      return await provider.sendAndConfirm(tx, this.partialSigners, opts);
    } catch (err) {
      throw translateError(err, this.idlErrors);
    }
  }
}

export type BuilderInstruction = {
  instructionPromise: Promise<TransactionInstruction>;
  authority: PublicKey;
};
