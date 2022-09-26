import {GatekeeperService} from "../../src/GatekeeperService";
import {PassState} from "../../src/lib/wrappers";
import {TEST_NETWORK} from "../util/constants";

import chai from 'chai';
import {createGatekeeperService} from "./util";

const expect = chai.expect;

describe("Issue pass", () => {
    let service: GatekeeperService;

    beforeEach(async () => {
        service = await createGatekeeperService()
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
