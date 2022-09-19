import {PassState} from "../../src/lib/wrappers";
import {changeState, createPassService} from "./util";
import {GatewayPassService} from "../../src/GatewayPassService";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Change pass state", () => {
    let service: GatewayPassService;

    beforeEach(async () => {
        service = await createPassService()
    })

    it("Cannot activate an active pass", async () => {
        return expect(changeState(
            service,
            PassState.Active,
            PassState.Active
        )).to.eventually.be.rejected;
    });

    it("Can activate a frozen pass", async () => {
        return expect(changeState(
            service,
            PassState.Frozen,
            PassState.Active
        )).to.eventually.be.fulfilled;
    });

    it("Cannot activate a revoked pass", async () => {
        return expect(changeState(
            service,
            PassState.Revoked,
            PassState.Active
        )).to.eventually.be.rejected;
    });

    it("Can freeze an active pass", async () => {
        return expect(changeState(
            service,
            PassState.Active,
            PassState.Frozen
        )).to.eventually.be.fulfilled;
    });

    it("Cannot freeze a frozen token", async () => {
        return expect(changeState(
            service,
            PassState.Frozen,
            PassState.Frozen
        )).to.eventually.be.rejected;
    });

    it("Cannot freeze a revoked token", async () => {
        return expect(changeState(
            service,
            PassState.Revoked,
            PassState.Frozen
        )).to.eventually.be.rejected;
    });

    it("Can revoke an active pass", async () => {
        return expect(changeState(
            service,
            PassState.Active,
            PassState.Revoked
        )).to.eventually.be.fulfilled;
    });

    it("Can revoke a frozen token", async () => {
        return expect(changeState(
            service,
            PassState.Frozen,
            PassState.Revoked
        )).to.eventually.be.fulfilled;
    });

    it("Cannot revoke a revoked token", async () => {
        return expect(changeState(
            service,
            PassState.Revoked,
            PassState.Revoked
        )).to.eventually.be.rejected;
    });
});
