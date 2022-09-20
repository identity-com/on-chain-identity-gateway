import {
  AnchorProvider,
  Program,
  Idl,
  parseIdlErrors,
  translateError,
} from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  AuthKeyStructure,
  CreateNetworkData,
  CreateGatekeeperData,
  UpdateGatekeeperData,
  FeeStructure,
  NetworkAccount,
  UpdateFeeStructure,
  UpdateNetworkData,
  Wallet,
  GatekeeperAccount,
  GatekeeperState,
} from './lib/types';

import {
  CustomClusterUrlConfig,
  ExtendedCluster,
  getConnectionByCluster,
} from './lib/connection';
import { findProgramAddress } from './lib/utils';
import {
  GatekeeperKeyFlags,
  GATEWAY_PROGRAM,
  SOLANA_MAINNET,
} from './lib/constants';
import { GatewayV2, IDL } from '../target/types/gateway_v2';

export class GatewayService {
  static async build(
    dataAccount: PublicKey,
    wallet: Wallet,
    cluster: ExtendedCluster = SOLANA_MAINNET,
    customConfig?: CustomClusterUrlConfig,
    opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ): Promise<GatewayService> {
    const _connection = getConnectionByCluster(
      cluster,
      opts.preflightCommitment,
      customConfig
    );

    const provider = new AnchorProvider(_connection, wallet, opts);

    const program = await GatewayService.fetchProgram(provider);

    return new GatewayService(
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
  ): Promise<GatewayService> {
    return new GatewayService(
      program,
      dataAccount,
      cluster,
      wallet,
      provider.opts
    );
  }
  static async fetchProgram(
    provider: anchor.Provider
  ): Promise<Program<GatewayV2>> {
    let idl = await Program.fetchIdl<GatewayV2>(GATEWAY_PROGRAM, provider);

    if (!idl) {
      console.warn(
        'Could not fetch IDL from chain. Using build-in IDL as fallback.'
      );
      idl = IDL;
    } else {
      console.log('using idl on-chain');
    }

    return new Program<GatewayV2>(
      idl,
      GATEWAY_PROGRAM,
      provider
    ) as Program<GatewayV2>;
  }

  private constructor(
    private _program: Program<GatewayV2>,
    private _dataAccount: PublicKey,
    private _cluster: ExtendedCluster = SOLANA_MAINNET,
    private _wallet: Wallet = new NonSigningWallet(),
    private _opts: ConfirmOptions = AnchorProvider.defaultOptions()
  ) {}

  static async createNetworkAddress(
    authority: PublicKey
  ): Promise<[PublicKey, number]> {
    return findProgramAddress('gk-network', authority);
  }

  static async createGatekeeperAddress(
    authority: PublicKey
  ): Promise<[PublicKey, number]> {
    return findProgramAddress('gatekeeper', authority);
  }

  getWallet(): Wallet {
    return this._wallet;
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

  closeNetwork(
    destination: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): GatewayServiceBuilder {
    const instructionPromise = this._program.methods
      .closeNetwork()
      .accounts({
        network: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        destination,
        authority,
      })
      .instruction();

    return new GatewayServiceBuilder(this, {
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
      signerBump: 0,
      fees: [],
      authKeys: [{ flags: 1, key: this._wallet.publicKey }],
    },
    authority: PublicKey = this._wallet.publicKey
  ): GatewayServiceBuilder {
    // console.log("Creating with auth: " + authority.toBase58());

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

    return new GatewayServiceBuilder(this, {
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
  ): GatewayServiceBuilder {
    const instructionPromise = this._program.methods
      // @ts-ignore
      .updateNetwork({
        authThreshold: data.authThreshold,
        passExpireTime: new anchor.BN(data.passExpireTime),
        // TODO?? Why do fees and authKeys have to be 'never' type??
        fees: data.fees,
        authKeys: data.authKeys,
      })
      .accounts({
        network: this._dataAccount,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    return new GatewayServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }

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
  ): GatewayServiceBuilder {
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

    return new GatewayServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }

  updateGatekeeper(
    data: UpdateGatekeeperData,
    authority: PublicKey = this._wallet.publicKey
  ): GatewayServiceBuilder {
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

    return new GatewayServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }

  closeGatekeeper(
    destination: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): GatewayServiceBuilder {
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

    return new GatewayServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }

  setGatekeeperState(
    state: GatekeeperState = GatekeeperState.Active,
    authority: PublicKey = this._wallet.publicKey
  ): GatewayServiceBuilder {
    const instructionPromise = this._program.methods
      .setGatekeeperState(state)
      .accounts({
        gatekeeper: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
      })
      .instruction();

    return new GatewayServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }

  gatekeeperWithdraw(
    receiver: PublicKey = this._wallet.publicKey,
    authority: PublicKey = this._wallet.publicKey
  ): GatewayServiceBuilder {
    const instructionPromise = this._program.methods
      .gatekeeperWithdraw(receiver)
      .accounts({
        gatekeeper: this._dataAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
      })
      .instruction();

    return new GatewayServiceBuilder(this, {
      instructionPromise,
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      allowsDynamicAlloc: false,
      authority,
    });
  }

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

class NonSigningWallet implements Wallet {
  publicKey: PublicKey;

  constructor() {
    this.publicKey = new PublicKey('11111111111111111111111111111111');
  }

  signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return Promise.reject(
      'NonSigningWallet does not support signing transactions'
    );
  }

  signTransaction(tx: Transaction): Promise<Transaction> {
    return Promise.reject(
      'NonSigningWallet does not support signing transactions'
    );
  }
}

export class GatewayServiceBuilder {
  private wallet: Wallet;
  private connection: Connection;
  private confirmOptions: ConfirmOptions;
  private partialSigners: Signer[] = [];
  private readonly idlErrors: Map<number, string>;

  constructor(
    private service: GatewayService,
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

  withConnection(connection: Connection): GatewayServiceBuilder {
    this.connection = connection;
    return this;
  }

  withConfirmOptions(confirmOptions: ConfirmOptions): GatewayServiceBuilder {
    this.confirmOptions = confirmOptions;
    return this;
  }

  withSolWallet(solWallet: Wallet): GatewayServiceBuilder {
    this.wallet = solWallet;
    return this;
  }

  // TODO
  withAutomaticAlloc(payer: PublicKey): GatewayServiceBuilder {
    this.authority = payer;
    return this;
  }

  withPartialSigners(...signers: Signer[]) {
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
