import {PassState} from "../../src/lib/wrappers";
import {createGatekeeperService} from "./util";
import {GatekeeperService} from "../../src/GatekeeperService";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {Keypair, PublicKey} from "@solana/web3.js";
import {TEST_NETWORK} from "../util/constants";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe.only("Change pass data", () => {
    let service: GatekeeperService;
    let subject: PublicKey;
    let account: PublicKey;

    beforeEach(async () => {
        service = await createGatekeeperService();

        subject = Keypair.generate().publicKey;
        account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

        await service.issue(account, subject).rpc();
    });

    it("Should be able to set network data", async () => {
        const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        await service.setPassData(account, null, data).rpc();
        const pass = await service.getPassAccount(subject);

        // Check: how to properly test this without toString
        expect(pass.networkData.toString()).to.equal(data.toString());
    });

    it("Should be able to set gatekeeper data", async () => {
        const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        await service.setPassData(account, data, null).rpc();
        const pass = await service.getPassAccount(subject);

        // Check: how to properly test this without toString
        expect(pass.gatekeeperData.toString()).to.equal(data.toString());
    });

    it("Should not be able set network data if not 32 bytes", async () => {
        const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

        expect(() => service.setPassData(account, null, data)).to.throw(/Data provided needs to be 32 bytes/)
    });

    it("Should not be able set gatekeeper data if not 32 bytes", async () => {
        const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);

        expect(() => service.setPassData(account, data, null)).to.throw(/Data provided needs to be 32 bytes/)
    });
});
