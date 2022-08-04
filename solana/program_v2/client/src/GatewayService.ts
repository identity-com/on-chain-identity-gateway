import { GatewayV2 } from './gateway_v2';
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
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import { Wallet } from './lib/types';

import { ExtendedCluster } from './lib/connection';
import { program } from '@project-serum/anchor/dist/cjs/spl/token';

export class GateWayService {
  
    static async buildFromAnchor(
      program: Program<GatewayV2>,
      cluster: ExtendedCluster,
      provider: AnchorProvider,
      wallet?: Wallet
    ): Promise<GateWayService> {
  
      return new GateWayService(
        program,
        cluster,
        wallet ? wallet : provider.wallet,
        provider.opts
      );
    }
    
  
    private constructor(
      private _program: Program<GatewayV2>,
      private _cluster: ExtendedCluster = 'mainnet-beta',
      private _wallet: Wallet = new DummyWallet(),
      private _opts: ConfirmOptions = AnchorProvider.defaultOptions()
    ) {
      // TODO what do we need to construct?
    }

    getWallet(): Wallet {
        return this._wallet;
      }
    
      getConnection(): Connection {
        return this._program.provider.connection;
      }
    
      getConfrirmOptions(): ConfirmOptions {
        return this._opts;
      }


    getIdl(): Idl {
        return this._program.idl;
    }

    createNetWork(
        payer: PublicKey
      ): GateWayServiceBuilder {
        const authority = this._program.provider.publicKey as PublicKey;
        const instructionPromise = this._program.methods
          .createNetwork({
            authThreshold: new anchor.BN(1),
            passExpireTime: new anchor.BN(360),
            signerBump: new anchor.BN(3),
            fees: [
              {
                token: provider.wallet.publicKey,
                issue: new anchor.BN(100),
                refresh: new anchor.BN(100),
                expire: new anchor.BN(100),
                verify: new anchor.BN(100),
              },
            ],
            authKeys: [
              {
                flags: new anchor.BN(1),
                key: provider.wallet.publicKey,
              },
            ],
          })
          .accounts({
            network: Keypair.generate().publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            //authority,
            payer,
          })
          .instruction();
    
        return new GateWayServiceBuilder(this, {
          instructionPromise,
          didAccountSizeDeltaCallback: () => {
            throw new Error('Dynamic Alloc not supported');
          },
          allowsDynamicAlloc: false,
          authority: authority,
        });
      }
}  


class DummyWallet implements Wallet {
    publicKey: PublicKey;
  
    constructor() {
      this.publicKey = new PublicKey('11111111111111111111111111111111');
    }
  
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
      return Promise.reject('DummyWallet does not support signing transactions');
    }
  
    signTransaction(tx: Transaction): Promise<Transaction> {
      return Promise.reject('DummyWallet does not support signing transactions');
    }
  }


  export class GateWayServiceBuilder {
    private gateWayWallet: Wallet;
    private connection: Connection;
    private confirmOptions: ConfirmOptions;
    private payer: PublicKey | undefined;
    private partialSigners: Signer[] = [];
    private readonly idlErrors: Map<number, string>;
  
    constructor(
      private service: GateWayService,
      //ToDo
      private _instruction: BuilderInstruction,
      payer: PublicKey = PublicKey.default,
    ) {
      this.gateWayWallet = this.service.getWallet();
      this.connection = this.service.getConnection();
      this.confirmOptions = this.service.getConfrirmOptions();
      this.payer = payer;
  
      this.idlErrors = parseIdlErrors(service.getIdl());
    }
  
    get instruction(): BuilderInstruction {
      return this._instruction;
    }
  
    withConnection(connection: Connection):  GateWayServiceBuilder {
      this.connection = connection;
      return this;
    }
  
    withConfirmOptions(confirmOptions: ConfirmOptions): GateWayServiceBuilder {
      this.confirmOptions = confirmOptions;
      return this;
    }
  
    withSolWallet(solWallet: Wallet): GateWayServiceBuilder {
      this.gateWayWallet = solWallet;
      return this;
    }
  
    withAutomaticAlloc(payer: PublicKey): GateWayServiceBuilder {
      this.payer = payer;
      return this;
    }
  
    withPartialSigners(...signers: Signer[]) {
      this.partialSigners = signers;
      return this;
    }

  
    async transaction(): Promise<Transaction> {
      const tx = new Transaction();
      const instructions = await this._instruction.instructionPromise
      tx.add(instructions);
      return tx;
    }
  
    async rpc(opts?: ConfirmOptions): Promise<string> {
      const provider = new AnchorProvider(
        this.connection,
        this.gateWayWallet,
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
    didAccountSizeDeltaCallback: (
      didAccountBefore:  | null
    ) => number;
    allowsDynamicAlloc: boolean;
    authority: PublicKey;
  };