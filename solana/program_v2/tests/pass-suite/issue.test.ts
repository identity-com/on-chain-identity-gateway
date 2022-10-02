import {GatekeeperService} from "../../src/GatekeeperService";
import {PassState} from "../../src/lib/wrappers";
import {TEST_GATEKEEPER, TEST_NETWORK} from "../util/constants";
import * as anchor from "@project-serum/anchor";
import chai from 'chai';
import {AnchorProvider, Program, Wallet} from "@project-serum/anchor";
import {GatewayV2} from '../../target/types/gateway_v2'
import {Keypair} from "@solana/web3.js";
import {createGatekeeperService} from "./util";

const expect = chai.expect;

describe("Issue pass", () => {
    // const kp = Keypair.generate();

    // const envProvider = anchor.AnchorProvider.env();
    // const provider = new AnchorProvider(envProvider.connection, new Wallet(kp), envProvider.opts);
    // anchor.setProvider(provider);


    // provider.connection.onLogs('all', (logs) => {
    //     console.log(logs)
    // });

    let service: GatekeeperService;

    beforeEach(async () => {
        service = await createGatekeeperService()
    })

    it("Issues a pass", async () => {
        const subject = Keypair.generate().publicKey;

        const account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);
        await service.issue(account, subject).rpc();
        const pass = await service.getPassAccount(subject);

        expect(pass).to.deep.include({
            version: 0,
            subject,
            network: TEST_NETWORK,
            gatekeeper: TEST_GATEKEEPER,
            state: PassState.Active
        });

        // CHECK: that the issueTime is recent (is this best?)
        expect(pass.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
        expect(pass.issueTime).to.be.lessThan(new Date().getTime() + 5000);
    });
});
