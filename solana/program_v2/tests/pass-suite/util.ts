import * as anchor from "@project-serum/anchor";
import {GatekeeperService} from "../../src/GatekeeperService";
import {airdrop} from "../../src/lib/utils";
import {TEST_GATEKEEPER, TEST_NETWORK} from "../util/constants";
import {Keypair, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {GatewayV2} from "../../target/types/gateway_v2";
import {PassState} from "../../src/lib/wrappers";

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
const programProvider = program.provider as anchor.AnchorProvider;

if (process.env.SOLANA_LOGS) {
    programProvider.connection.onLogs('all', (logs) => {
        console.log(logs)
    });
}

export const createGatekeeperService = async () => {
    let service: GatekeeperService;
    let dataAccount: PublicKey;
    let bump: number;
    let authorityKeypair = Keypair.generate();

    let authority = new anchor.Wallet(authorityKeypair);

    await airdrop(
        programProvider.connection,
        authority.publicKey,
        LAMPORTS_PER_SOL * 2
    );

    [dataAccount, bump] = await GatekeeperService.createPassAddress(
        authority.publicKey,
        TEST_NETWORK
    );

    service = await GatekeeperService.buildFromAnchor(
        program,
        dataAccount,
        TEST_NETWORK,
        TEST_GATEKEEPER,
        'localnet',
        programProvider,
        authority
    );

    await service.issue(authority.publicKey).rpc();

    return service;
}

export const changeState = async (service: GatekeeperService, from: PassState, to: PassState) => {
    const account = await service.getPassAccount();

    // Get it in the expected state
    if (account.state !== from) {
        await service.setState(from).rpc();
    }

    await service.setState(to).rpc();

    const updatedAccount = await service.getPassAccount();

    if (updatedAccount.state !== to) {
        throw new Error("State change failed");
    }
}