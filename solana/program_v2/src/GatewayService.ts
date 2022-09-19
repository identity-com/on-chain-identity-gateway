import {GatewayV2} from '../target/types/gateway_v2';
import {
    AnchorProvider,
    Program,
} from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    ConfirmOptions,
    PublicKey,
} from '@solana/web3.js';

import {
    AuthKeyStructure,
    CreateNetworkData,
    FeeStructure,
    NetworkAccount,
    UpdateNetworkData,
    Wallet,
} from './lib/types';

import {findProgramAddress} from './lib/utils';
import {DEFAULT_NETWORK_SEED, SOLANA_MAINNET} from './lib/constants';
import {ServiceBuilder, Service} from "./Service";
import {CustomClusterUrlConfig, ExtendedCluster, getConnectionByCluster} from "./lib/connection";

export class GatewayService extends Service {
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

    static async createNetworkAddress(
        authority: PublicKey
    ): Promise<[PublicKey, number]> {
        return findProgramAddress(authority, DEFAULT_NETWORK_SEED);
    }

    closeNetwork(
        destination: PublicKey = this.getWallet().publicKey,
        authority: PublicKey = this.getWallet().publicKey
    ): ServiceBuilder {
        const instructionPromise = this.getProgram().methods
            .closeNetwork()
            .accounts({
                network: this.getDataAccount(),
                systemProgram: anchor.web3.SystemProgram.programId,
                destination,
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

    createNetwork(
        data: CreateNetworkData = {
            authThreshold: 1,
            passExpireTime: 16,
            signerBump: 0,
            fees: [],
            authKeys: [{flags: 1, key: this.getWallet().publicKey}],
        },
        authority: PublicKey = this.getWallet().publicKey
    ): ServiceBuilder {
        // console.log("Creating with auth: " + authority.toBase58());

        const instructionPromise = this.getProgram().methods
            .createNetwork({
                authThreshold: data.authThreshold,
                passExpireTime: new anchor.BN(data.passExpireTime),
                fees: data.fees,
                authKeys: data.authKeys,
            })
            .accounts({
                network: this.getDataAccount(),
                systemProgram: anchor.web3.SystemProgram.programId,
                authority,
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

    updateNetwork(
        data: UpdateNetworkData,
        authority: PublicKey = this.getWallet().publicKey
    ): ServiceBuilder {
        const instructionPromise = this.getProgram().methods
            .updateNetwork({
                authThreshold: data.authThreshold,
                passExpireTime: new anchor.BN(data.passExpireTime),
                // TODO?? Why do fees and authKeys have to be 'never' type??
                // @ts-ignore
                fees: data.fees as never,
                // @ts-ignore
                authKeys: data.authKeys as never,
            })
            .accounts({
                network: this.getDataAccount(),
                authority,
                systemProgram: anchor.web3.SystemProgram.programId,
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

    async getNetworkAccount(
        account: PublicKey = this.getDataAccount()
    ): Promise<NetworkAccount | null> {
        const networkAccount = this.getProgram().account.gatekeeperNetwork
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
}