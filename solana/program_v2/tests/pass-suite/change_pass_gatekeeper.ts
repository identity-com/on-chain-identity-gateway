import {PassState} from "../../src/lib/wrappers";
import {createGatekeeperService, createNetworkService} from "./util";
import {GatekeeperService} from "../../src/GatekeeperService";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {NetworkService} from "../../src/NetworkService";
import {Keypair, PublicKey} from "@solana/web3.js";
import {TEST_ALT_NETWORK, TEST_NETWORK} from "../util/constants";
import {GatekeeperKeyFlags} from "../../src/lib/constants";

chai.use(chaiAsPromised);
const expect = chai.expect;

const setGatekeeperFlags = async (service: NetworkService, flags: number) => {
    const gatekeeper = await service.getGatekeeperAccount();

    await service.updateGatekeeper({
        authThreshold: 1,
        addresses: null,
        gatekeeperNetwork: gatekeeper.gatekeeperNetwork,
        fees: {remove: [] as any, add: [] as any},
        stakingAccount: null,
        authKeys: {
            add: [{
                key: service.getWallet().publicKey,
                flags: flags
            }],
            remove: []
        }
    }).rpc();
}

describe("Change pass gatekeeper", () => {
    let service: GatekeeperService;
    let subject: PublicKey;
    let account: PublicKey;

    beforeEach(async () => {
        service = await createGatekeeperService();

        subject = Keypair.generate().publicKey;
        account = await GatekeeperService.createPassAddress(subject, TEST_NETWORK);

        await service.issue(account, subject).rpc();
    });


    it("Can change to gatekeeper within the same network", async () => {
        const networkService = await createNetworkService(Keypair.generate());
        await networkService.createGatekeeper(TEST_NETWORK).rpc();

        await service.changePassGatekeeper(networkService.getDataAccount(), account).rpc();

        const pass = await service.getPassAccount(subject);

        expect(pass.gatekeeper.toBase58()).to.equal(networkService.getDataAccount().toBase58());
    });

    it("Cannot change to gatekeeper within a different network", async () => {
        const networkService = await createNetworkService(Keypair.generate());
        await networkService.createGatekeeper(TEST_ALT_NETWORK).rpc();

        return expect(
            service.changePassGatekeeper(networkService.getDataAccount(), account).rpc()
        ).to.eventually.be.rejectedWith(/InvalidNetwork/);
    });

    it("123", async () => {
        const networkService = await createNetworkService(Keypair.generate());
        await networkService.createGatekeeper(TEST_NETWORK).rpc();
        await setGatekeeperFlags(networkService, GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.CHANGE_PASS_GATEKEEPER);

    })
});
