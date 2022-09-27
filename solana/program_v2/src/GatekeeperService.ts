import {GatewayV2} from '../target/types/gateway_v2';
import {AnchorProvider, Program} from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    ConfirmOptions,
    PublicKey,
} from '@solana/web3.js';

import {Wallet} from './lib/types';

import {EnumMapper, findProgramAddress} from './lib/utils';
import {DEFAULT_PASS_SEED, GATEWAY_PROGRAM, SOLANA_MAINNET} from './lib/constants';
import {ServiceBuilder, AbstractService, NonSigningWallet} from "./utils/AbstractService";
import {CustomClusterUrlConfig, ExtendedCluster, getConnectionByCluster} from "./lib/connection";
import {PassAccount, PassState, PassStateMapping} from "./lib/wrappers";

export class GatekeeperService extends AbstractService {
    private constructor(_program: Program<GatewayV2>,
                        _dataAccount: PublicKey,
                        private _network: PublicKey,
                        private _gatekeeper: PublicKey,
                        _cluster: ExtendedCluster = SOLANA_MAINNET,
                        _wallet: Wallet = new NonSigningWallet(),
                        _opts: ConfirmOptions = AnchorProvider.defaultOptions()) {
        super(_program, _dataAccount, _cluster, _wallet, _opts);
    }

    static async build(
        dataAccount: PublicKey,
        network: PublicKey,
        gatekeeper: PublicKey,
        wallet: Wallet,
        cluster: ExtendedCluster = SOLANA_MAINNET,
        customConfig?: CustomClusterUrlConfig,
        opts: ConfirmOptions = AnchorProvider.defaultOptions()
    ): Promise<GatekeeperService> {
        const _connection = getConnectionByCluster(
            cluster,
            opts.preflightCommitment,
            customConfig
        );

        const provider = new AnchorProvider(_connection, wallet, opts);

        const program = await AbstractService.fetchProgram(provider);

        return new GatekeeperService(
            program,
            dataAccount,
            network,
            gatekeeper,
            cluster,
            wallet,
            provider.opts
        );
    }

    static async buildFromAnchor(
        program: Program<GatewayV2>,
        dataAccount: PublicKey,
        network: PublicKey,
        gatekeeper: PublicKey,
        cluster: ExtendedCluster,
        provider: AnchorProvider = program.provider as AnchorProvider,
        wallet: Wallet = provider.wallet
    ): Promise<GatekeeperService> {
        return new GatekeeperService(
            program,
            dataAccount,
            network,
            gatekeeper,
            cluster,
            wallet,
            provider.opts
        );
    }

    static async createPassAddress(
        subject: PublicKey,
        network: PublicKey,
        pass_number: number = 0
    ): Promise<[PublicKey, number]> {
        const pass_number_buffer = Buffer.alloc(2);
        pass_number_buffer.writeInt16LE(pass_number);

        return PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode(DEFAULT_PASS_SEED), subject.toBuffer(), network.toBuffer(), pass_number_buffer],
            GATEWAY_PROGRAM
        );
    }

    issue(
        authority: PublicKey = this.getWallet().publicKey,
        passNumber: number = 0
    ): ServiceBuilder {
        const instructionPromise = this.getProgram().methods
            .issuePass(authority, passNumber)
            .accounts({
                pass: this._dataAccount,
                systemProgram: anchor.web3.SystemProgram.programId,
                authority,
                network: this._network,
                gatekeeper: this._gatekeeper
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
        subject: PublicKey = this.getWallet().publicKey,
        passNumber = 0,
        authority: PublicKey = this.getWallet().publicKey
    ): ServiceBuilder {
        const instructionPromise = this.getProgram().methods
            .setPassState(EnumMapper.to(state, PassStateMapping), subject, passNumber)
            .accounts({
                pass: this.getDataAccount(),
                systemProgram: anchor.web3.SystemProgram.programId,
                authority,
                network: this._network
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
        subject: PublicKey = this.getWallet().publicKey,
        passNumber = 0,
        authority: PublicKey = this.getWallet().publicKey
    ): ServiceBuilder {
        const instructionPromise = this.getProgram().methods
            .refreshPass(subject, passNumber)
            .accounts({
                pass: this.getDataAccount(),
                systemProgram: anchor.web3.SystemProgram.programId,
                authority,
                network: this._network
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
        account: PublicKey = this.getDataAccount()
    ): Promise<PassAccount | null> {
        return this.getProgram().account.pass
            .fetchNullable(account)
            .then(PassAccount.from);
    }
}