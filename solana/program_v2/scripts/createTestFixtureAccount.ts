import * as anchor from '@project-serum/anchor';
import {Keypair, LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {exec as execCB} from 'child_process';
import * as util from 'util';
import {GatewayV2} from '../target/types/gateway_v2';
import {airdrop} from '../src/lib/utils';
import {GATEWAY_PROGRAM} from '../src/lib/constants';
import {AdminService} from "../src/AdminService";
import {NetworkService} from "../src/NetworkService";

const exec = util.promisify(execCB);

const fixturePath = './tests/fixtures/accounts/';

//copied from anchor
export async function idlAddress(programId: PublicKey): Promise<PublicKey> {
    const base = (await PublicKey.findProgramAddress([], programId))[0];
    return await PublicKey.createWithSeed(base, 'anchor:idl', programId);
}

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
const programProvider = program.provider as anchor.AnchorProvider;


const createNetworkAccount = async (authorityKeypair: Keypair, filename: string) => {
    let authority = new anchor.Wallet(authorityKeypair);

    await airdrop(
        programProvider.connection,
        authority.publicKey,
        LAMPORTS_PER_SOL * 2
    );

    const [dataAccount] = await AdminService.createNetworkAddress(
        authority.publicKey
    );

    const service = await AdminService.buildFromAnchor(
        program,
        dataAccount,
        'localnet',
        programProvider,
        authority
    );

    const foundAccount = await service.getNetworkAccount();

    if (!foundAccount)
        await service.createNetwork().rpc();

    await exec(
        `solana account ${dataAccount.toBase58()} -ul -o ${fixturePath}${filename} --output json`
    );

    console.log(`Creating Network ${dataAccount.toBase58()}`);

    return dataAccount;
}

const createGatekeeperAccount = async (network: PublicKey, authorityKeypair: Keypair, filename: string) => {
    let authority = new anchor.Wallet(authorityKeypair);

    await airdrop(
        programProvider.connection,
        authority.publicKey,
        LAMPORTS_PER_SOL * 2
    );

    const [dataAccount] = await NetworkService.createGatekeeperAddress(
        authority.publicKey,
    );

    const service = await NetworkService.buildFromAnchor(
        program,
        dataAccount,
        'localnet',
        programProvider,
        authority
    );

    const foundAccount = await service.getGatekeeperAccount();

    if (!foundAccount)
        await service.createGatekeeper(network, undefined, authority.publicKey).rpc();

    await exec(
        `solana account ${dataAccount.toBase58()} -ul -o ${fixturePath}${filename} --output json`
    );

    console.log(`Creating Gatekeeper ${dataAccount.toBase58()}`);
}


(async () => {
    const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
    const programProvider = program.provider as anchor.AnchorProvider;

    const authority = programProvider.wallet;

    await airdrop(
        programProvider.connection,
        authority.publicKey,
        100 * anchor.web3.LAMPORTS_PER_SOL
    );

    console.log(
        `anchor idl init --filepath ./target/idl/gateway_v2.json ${GATEWAY_PROGRAM}`
    );
    console.log('Deploying IDL');
    // Deploy IDL
    await exec(
        `anchor idl init --filepath ./target/idl/gateway_v2.json ${GATEWAY_PROGRAM}`
    );

    // write account
    const idlAddr = await idlAddress(GATEWAY_PROGRAM);
    console.log(`Done deploying IDL at ${idlAddr.toBase58()}`);

    await exec(
        `solana account ${idlAddr.toBase58()} -ul -o ${fixturePath}idl-account.json --output json`
    );

    // Create the network account to be used in tests
    const networkAccount = await createNetworkAccount(
        Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/B4951ZxztgHL98WT4eFUyaaRmsi6V4hBzkoYe1VSNweo.json`))),
        'network-account.json'
    );
    const altNetworkAccount = await createNetworkAccount(
        Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/DuqrwqMDuVwgd2BNbCFQS5gwNuZcfgjuL6KpuvjGjaYa.json`))),
        'alt-network-account.json'
    );
    const gatekeeperAccount = await createGatekeeperAccount(
        networkAccount,
        Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/B4951ZxztgHL98WT4eFUyaaRmsi6V4hBzkoYe1VSNweo.json`))),
        'gatekeeper-account.json'
    );
    const altGatekeeperAccount = await createGatekeeperAccount(
        networkAccount,
        Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/DuqrwqMDuVwgd2BNbCFQS5gwNuZcfgjuL6KpuvjGjaYa.json`))),
        'alt-gatekeeper-account.json'
    );
    const invalidGatekeeperAccount = await createGatekeeperAccount(
        altNetworkAccount,
        Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/6ufu3BBssTiNhQ5ejtkNGfqksXQatAZ5aVFVPNQy8wu9.json`))),
        'invalid-gatekeeper-account.json'
    );
})().catch(console.error);
