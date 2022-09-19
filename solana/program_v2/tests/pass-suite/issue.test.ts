import * as anchor from "@project-serum/anchor";
import {airdrop} from "../../src/lib/utils";
import {Keypair, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {GatewayPassService} from "../../src/GatewayPassService";
import {PassState} from "../../src/lib/wrappers";
import {TEST_NETWORK} from "../util/constants";
import {GatewayV2} from "../../target/types/gateway_v2";

import chai from 'chai';
import {createPassService} from "./util";

const expect = chai.expect;

describe("Issue pass", () => {
    let service: GatewayPassService;

    beforeEach(async () => {
        service = await createPassService()
    })

    it("Issues a pass", async () => {
        const pass = await service.getPassAccount();

        expect(pass).to.deep.include({
            version: 0,
            authority: service.getWallet().publicKey,
            network: TEST_NETWORK,
            state: PassState.Active
        })

        // Check that the issueTime is recent
        expect(pass.issueTime).to.be.greaterThan(new Date().getTime() - 5000);
        expect(pass.issueTime).to.be.lessThan(new Date().getTime() + 5000);
    });
});
