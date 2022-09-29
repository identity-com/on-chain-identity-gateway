import {PassState} from "../../src/lib/wrappers";
import {createGatekeeperService} from "./util";
import {GatekeeperService} from "../../src/GatekeeperService";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Refresh a pass", () => {
    let service: GatekeeperService;

    beforeEach(async () => {
        service = await createGatekeeperService()
    })

    it("Refreshes a pass", async () => {
        const initialPass = await service.getPassAccount();

        await new Promise(r => setTimeout(r, 2000));

        await service.refreshPass().rpc();

        const updatedPass = await service.getPassAccount();

        expect(initialPass.issueTime).to.be.lt(updatedPass.issueTime);
    });


    it("Cannot refresh a frozen pass", async () => {
        await service.setState(PassState.Frozen).rpc();
        return expect(service.refreshPass().rpc()).to.eventually.be.rejected;
    });

    it("Cannot refresh a revoked pass", async () => {
        await service.setState(PassState.Revoked).rpc();
        return expect(service.refreshPass().rpc()).to.eventually.be.rejected;
    });
});
