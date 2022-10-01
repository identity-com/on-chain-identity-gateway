import {GatekeeperService} from "../../src/GatekeeperService";
import {PassState} from "../../src/lib/wrappers";
import {TEST_GATEKEEPER, TEST_MINT, TEST_NETWORK} from "../util/constants";
import {
    getOrCreateAssociatedTokenAccount,
    mintTo,
    getAccount
} from '@solana/spl-token';
import * as anchor from "@project-serum/anchor";
import chai from 'chai';
import {AnchorProvider, Program, Wallet} from "@project-serum/anchor";
import {GatewayV2} from '../../target/types/gateway_v2'
import {Keypair, LAMPORTS_PER_SOL} from "@solana/web3.js";
import {airdrop} from "../../src/lib/utils";
import {createGatekeeperService} from "./util";

const expect = chai.expect;

describe("Issue pass", () => {
    const kp = Keypair.generate();

    const envProvider = anchor.AnchorProvider.env();
    const provider = new AnchorProvider(envProvider.connection, new Wallet(kp), envProvider.opts);
    anchor.setProvider(provider);

    const program = anchor.workspace.Spltoken as Program<GatewayV2>;

    // provider.connection.onLogs('all', (logs) => {
    //     console.log(logs)
    // });

    let service: GatekeeperService;

    beforeEach(async () => {
        service = await createGatekeeperService()
    })

    // it("random", async () => {
    //     const kp = Keypair.fromSecretKey(new Uint8Array(require('../fixtures/keypairs/9SkxBuj9kuaJQ3yAXEuRESjYt14BcPUTac25Mbi1n8ny.json')));
    //     const mintAuthority = kp;
    //     await airdrop(provider.connection, mintAuthority.publicKey, LAMPORTS_PER_SOL);
    //
    //     // const fromKeypair = Keypair.generate();
    //     const fromKeypair = kp;
    //     await airdrop(provider.connection, fromKeypair.publicKey, LAMPORTS_PER_SOL);
    //
    //     const toKeypair = Keypair.generate();
    //     await airdrop(provider.connection, toKeypair.publicKey, LAMPORTS_PER_SOL);
    //
    //
    //     const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    //         provider.connection,
    //         fromKeypair,
    //         TEST_MINT,
    //         fromKeypair.publicKey
    //     );
    //
    //     const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    //         provider.connection,
    //         fromKeypair,
    //         TEST_MINT,
    //         toKeypair.publicKey
    //     );
    //
    //     let signature = await mintTo(
    //         provider.connection,
    //         fromKeypair,              // Payer of the transaction fees
    //         TEST_MINT,                // Mint for the account
    //         fromTokenAccount.address, // Address of the account to mint to
    //         kp,                       // Minting authority
    //         1000              // Amount to mint
    //     );
    //
    //     service = await createGatekeeperService(TEST_MINT, fromTokenAccount.address, toTokenAccount.address, fromKeypair);
    //
    //     const a = await getAccount(provider.connection, fromTokenAccount.address);
    //     console.log(a.amount.toString(10));
    //
    // });

    it("Issues a pass", async () => {
        const pass = await service.getPassAccount();

        expect(pass).to.deep.include({
            version: 0,
            subject: service.getWallet().publicKey,
            network: TEST_NETWORK,
            gatekeeper: TEST_GATEKEEPER,
            state: PassState.Active
        });

        // CHECK: that the issueTime is recent (is this best?)
        expect(pass.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
        expect(pass.issueTime).to.be.lessThan(new Date().getTime() + 5000);
    });
});
