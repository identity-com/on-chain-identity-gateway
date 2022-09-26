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


const createNetworkAccount = async () => {

    let authorityKeypair = Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/B4951ZxztgHL98WT4eFUyaaRmsi6V4hBzkoYe1VSNweo.json`)));
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
        `solana account ${dataAccount.toBase58()} -ul -o ${fixturePath}network-account.json --output json`
    );

    console.log("Test network account created");

    return dataAccount;
}

const createGatekeeperAccount = async (network: PublicKey) => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
    const programProvider = program.provider as anchor.AnchorProvider;

    let authorityKeypair = Keypair.fromSecretKey(new Uint8Array(require(`../tests/fixtures/keypairs/B4951ZxztgHL98WT4eFUyaaRmsi6V4hBzkoYe1VSNweo.json`)));
    let authority = new anchor.Wallet(authorityKeypair);

    await airdrop(
        programProvider.connection,
        authority.publicKey,
        LAMPORTS_PER_SOL * 2
    );

    const [dataAccount] = await NetworkService.createGatekeeperAddress(
        authority.publicKey
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
        await service.createGatekeeper(network).rpc();

    await exec(
        `solana account ${dataAccount.toBase58()} -ul -o ${fixturePath}gatekeeper-account.json --output json`
    );

    console.log("Test network account created");
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
    const networkAccount = await createNetworkAccount();
    const gatekeeperAccount = await createGatekeeperAccount(networkAccount);
})().catch(console.error);
