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
const chai_1 = require("chai");
const sinon = require("sinon");
const src_1 = require("../../src");
const web3_js_1 = require("@solana/web3.js");
const sandbox = sinon.createSandbox();
const getAccountWithState = (state, pubkey) => ({ pubkey, account: { data: { parsed: { info: { state } } } } });
describe('findGatewayToken', () => {
    let connection;
    let owner;
    let gatekeeperKey;
    let testAccount;
    let getParsedTokenAccountsByOwnerStub;
    beforeEach(() => {
        connection = new web3_js_1.Connection(web3_js_1.clusterApiUrl('devnet'));
        owner = new web3_js_1.Account().publicKey;
        gatekeeperKey = new web3_js_1.Account().publicKey;
        getParsedTokenAccountsByOwnerStub = sandbox.stub(connection, 'getParsedTokenAccountsByOwner').withArgs(owner, {
            mint: gatekeeperKey,
        });
    });
    context('with no token accounts found', () => {
        it('should return null with no value', () => __awaiter(void 0, void 0, void 0, function* () {
            getParsedTokenAccountsByOwnerStub.resolves({});
            const findGatewayTokenResponse = yield src_1.findGatewayToken(connection, owner, gatekeeperKey);
            chai_1.expect(findGatewayTokenResponse).to.be.null;
        }));
        it('should return null with an empty array', () => __awaiter(void 0, void 0, void 0, function* () {
            getParsedTokenAccountsByOwnerStub.resolves({ value: [] });
            const findGatewayTokenResponse = yield src_1.findGatewayToken(connection, owner, gatekeeperKey);
            chai_1.expect(findGatewayTokenResponse).to.be.null;
        }));
    });
    context('with token accounts found', () => {
        context('with a frozen account', () => {
            it('should return null', () => __awaiter(void 0, void 0, void 0, function* () {
                getParsedTokenAccountsByOwnerStub.resolves({ value: [getAccountWithState('frozen', owner)] });
                const findGatewayTokenResponse = yield src_1.findGatewayToken(connection, owner, gatekeeperKey);
                chai_1.expect(findGatewayTokenResponse).to.be.null;
            }));
        });
        context('with a valid account', () => {
            it('should return the public key', () => __awaiter(void 0, void 0, void 0, function* () {
                const testPubKey = new web3_js_1.Account().publicKey;
                getParsedTokenAccountsByOwnerStub.resolves({ value: [getAccountWithState('valid', testPubKey)] });
                const findGatewayTokenResponse = yield src_1.findGatewayToken(connection, owner, gatekeeperKey);
                chai_1.expect(findGatewayTokenResponse).to.eq(testPubKey);
            }));
        });
    });
});
//# sourceMappingURL=findGatewayToken.test.js.map