import {PassState} from "../../src/lib/wrappers";
import {createGatekeeperService} from "./util";
import {GatekeeperService} from "../../src/GatekeeperService";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {Keypair, PublicKey} from "@solana/web3.js";
import {TEST_NETWORK} from "../util/constants";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Change pass data", () => {
    let service: GatekeeperService;
    let subject: PublicKey;
    let account: PublicKey;

    beforeEach(async () => {
        service = await createGatekeeperService();

        subject = Keypair.generate().publicKey;
        account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

        await service.issue(account, subject).rpc();
    });

    it("Should be able to set data", async () => {

    });

    it("Should not be able set data if not 32 bytes", async () => {

    });
});
