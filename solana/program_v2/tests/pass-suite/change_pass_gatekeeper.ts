import {PassState} from "../../src/lib/wrappers";
import {changeState, createGatekeeperService} from "./util";
import {GatekeeperService} from "../../src/GatekeeperService";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Change pass gatekeeper", () => {
    let service: GatekeeperService;

    beforeEach(async () => {
        service = await createGatekeeperService()
    })

    it.only("Cannot activate an active pass", async () => {
        service.changePassGatekeeper(service.getGatekeeper());
    });
});
