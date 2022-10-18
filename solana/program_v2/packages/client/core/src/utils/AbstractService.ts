// TODO: Update this with refactor (IDCOM-2108)
// import { GatewayV2, IDL } from '../../target/types/gateway_v2';
import {
  AnchorProvider,
  Program,
  Idl,
  parseIdlErrors,
  translateError,
} from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
//import idl
import { GatewayV2, IDL } from '@identity.com/gateway_v2-idl';
import { Wallet } from '../lib/types';

import { ExtendedCluster } from '../lib/connection';
import { GATEWAY_PROGRAM, SOLANA_MAINNET } from '../lib/constants';

export abstract class AbstractService {
  protected constructor(
    protected _program: Program<GatewayV2>,
    protected _dataAccount: PublicKey | undefined,
    protected _cluster: ExtendedCluster = SOLANA_MAINNET,
    protected _wallet: Wallet = new NonSigningWallet(),
    protected _opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {}

  static async fetchProgram(
    provider: anchor.Provider
  ): Promise<Program<GatewayV2>> {
    // TODO: Update IDL loading (IDCOM-2108)
    return new Program<GatewayV2>(
      IDL,
      GATEWAY_PROGRAM,
      provider
    ) as Program<GatewayV2>;
  }

  getWallet(): Wallet {
    return this._wallet;
  }

  getDataAccount(): PublicKey | undefined {
    return this._dataAccount;
  }

  getProgram(): Program<GatewayV2> {
    return this._program;
  }

  getConnection(): Connection {
    return this._program.provider.connection;
  }

  getConfirmOptions(): ConfirmOptions {
    return this._opts;
  }

  getIdl(): Idl {
    return this._program.idl;
  }
}

export class NonSigningWallet implements Wallet {
  publicKey: PublicKey;

  constructor() {
    this.publicKey = new PublicKey('11111111111111111111111111111111');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signAllTransactions(_txs: Transaction[]): Promise<Transaction[]> {
    return Promise.reject(
      'NonSigningWallet does not support signing transactions'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signTransaction(_tx: Transaction): Promise<Transaction> {
    return Promise.reject(
      'NonSigningWallet does not support signing transactions'
    );
  }
}

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

  get instruction(): BuilderInstruction {
    return this._instruction;
  }

  withConnection(connection: Connection): ServiceBuilder {
    this.connection = connection;
    return this;
  }

  withConfirmOptions(confirmOptions: ConfirmOptions): ServiceBuilder {
    this.confirmOptions = confirmOptions;
    return this;
  }

  withWallet(wallet: Wallet): ServiceBuilder {
    this.wallet = wallet;
    return this;
  }

  // TODO
  withAutomaticAlloc(payer: PublicKey): ServiceBuilder {
    this.authority = payer;
    return this;
  }

  withPartialSigners(...signers: Signer[]): ServiceBuilder {
    this.partialSigners = signers;
    return this;
  }

  async transaction(): Promise<Transaction> {
    const tx = new Transaction();
    const instructions = await this._instruction.instructionPromise;
    tx.add(instructions);
    return tx;
  }

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
  didAccountSizeDeltaCallback: (didAccountBefore: null) => number;
  allowsDynamicAlloc: boolean;
  authority: PublicKey;
};
