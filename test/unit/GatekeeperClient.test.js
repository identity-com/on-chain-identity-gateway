"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
const chai_1 = require("chai");
const fetchMock = require("fetch-mock");
const web3_js_1 = require("@solana/web3.js");
describe('GatekeeperClient', () => {
    context('constructor', () => {
        it('should throw an error if no config is provided', () => {
            chai_1.expect(() => new src_1.GatekeeperClient({})).to.throw('No valid config provided');
        });
        it('should add config as an instance variable', () => {
            const baseUrl = 'test_baseUrl';
            const clientInst = new src_1.GatekeeperClient({ baseUrl });
            chai_1.expect(clientInst.config).to.deep.eq({ baseUrl });
        });
    });
    context('baseUrl', () => {
        it('should return the config baseUrl', () => {
            const baseUrl = 'test_baseUrl';
            const clientInst = new src_1.GatekeeperClient({ baseUrl });
            chai_1.expect(clientInst.baseUrl).to.eq(baseUrl);
        });
    });
    context('createGatewayToken', () => {
        let gatekeeperClientInst;
        let baseUrl;
        let walletPublicKey;
        beforeEach(() => {
            walletPublicKey = new web3_js_1.Account().publicKey;
            baseUrl = 'test_baseUrl';
            gatekeeperClientInst = new src_1.GatekeeperClient({ baseUrl });
        });
        context('with only the walletPublicKey passed', () => {
            it('should call fetch with an address param', () => __awaiter(void 0, void 0, void 0, function* () {
                const myMock = fetchMock.sandbox().mock(baseUrl, 200);
                yield gatekeeperClientInst.createGatewayToken(walletPublicKey);
                chai_1.expect(myMock.called(baseUrl)).to.be.true;
            }));
        });
    });
});
//# sourceMappingURL=GatekeeperClient.test.js.map