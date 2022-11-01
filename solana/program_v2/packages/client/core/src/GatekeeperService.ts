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

  issue(
    passAccount: PublicKey,
    subject: PublicKey,
    passNumber = 0,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.issuePass(subject, passNumber)
      .accounts({
        pass: passAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        payer: authority,
        authority,
        network: this._network,
        gatekeeper: this._gatekeeper,
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
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      // TODO: Implement this...
      allowsDynamicAlloc: false,
      authority,
    });
  }

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
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      // TODO: Implement this...
      allowsDynamicAlloc: false,
      authority,
    });
  }

  expirePass(
    pass: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.expirePass()
      .accounts({
        pass,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
        gatekeeper: this._gatekeeper,
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

  verifyPass(
    pass: PublicKey,
    authority: PublicKey = this.getWallet().publicKey
  ): ServiceBuilder {
    const instructionPromise = this.getProgram()
      .methods.verifyPass()
      .accounts({
        pass,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority,
        network: this._network,
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
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      // TODO: Implement this...
      allowsDynamicAlloc: false,
      authority,
    });
  }

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
      didAccountSizeDeltaCallback: () => {
        throw new Error('Dynamic Alloc not supported');
      },
      // TODO: Implement this...
      allowsDynamicAlloc: false,
      authority,
    });
  }

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

  getGatekeeper(): PublicKey {
    return this._gatekeeper;
  }

  getNetwork(): PublicKey {
    return this._network;
  }
}
