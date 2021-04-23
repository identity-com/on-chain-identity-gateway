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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGatewayToken = exports.GatekeeperClient = void 0;
const axios_1 = __importDefault(require("axios"));
const handleFetchError = (response) => {
    if (response.status > 299) {
        console.error('handleFetchError', response);
        const errorJson = response.data;
        const errorMessage = errorJson.message || response.statusText;
        console.log('handleFetchError', { errorJson, errorMessage });
        throw new Error(errorMessage);
    }
    return response;
};
const postGatekeeperServer = (baseUrl, body, path = '') => __awaiter(void 0, void 0, void 0, function* () {
    const postResponse = yield axios_1.default.post(`${baseUrl}${path}`, body);
    yield handleFetchError(postResponse);
    return postResponse.data;
});
class GatekeeperClient {
    constructor(config) {
        if (!config || !(config === null || config === void 0 ? void 0 : config.baseUrl)) {
            throw new Error('No valid config provided');
        }
        this.config = config;
    }
    get baseUrl() {
        return this.config.baseUrl;
    }
    /**
     * This function creates gateway tokens for current connected wallet
     * If called and a gateway token already exists for this wallet, it will throw an exception
     *
     * @param {PublicKey} walletPublicKey
     * @param {string} [scopeRequestId] If a Civic scope request was used to verify the identity of the trader, pass it here.
     */
    createGatewayToken(walletPublicKey, scopeRequestId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Creating a new gatekeeper token');
            const body = scopeRequestId ? { scopeRequest: scopeRequestId } : { address: walletPublicKey.toBase58() };
            return postGatekeeperServer(this.baseUrl, body);
        });
    }
    auditGatewayToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const getResponse = yield axios_1.default.get(`${this.baseUrl}/${token}`);
            yield handleFetchError(getResponse);
            return getResponse.data;
        });
    }
    requestAirdrop(walletPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Requesting airdrop to key ${walletPublicKey.toBase58()}`);
            yield postGatekeeperServer(this.baseUrl, { publicKey: walletPublicKey.toBase58() }, '/airdrop');
        });
    }
}
exports.GatekeeperClient = GatekeeperClient;
/**
 * attempts to fetch a gateway token from the Solana blockchain. Will return null if the token account doesn't exist
 * or has been frozen
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} gatekeeperKey
 * @returns Promise<PublicKey | null>
 */
const findGatewayToken = (connection, owner, gatekeeperKey) => __awaiter(void 0, void 0, void 0, function* () {
    const accountsResponse = yield connection.getParsedTokenAccountsByOwner(owner, {
        mint: gatekeeperKey,
    });
    if (!accountsResponse.value)
        return null;
    const validAccounts = accountsResponse.value.filter((entry) => { var _a, _b, _c, _d; return ((_d = (_c = (_b = (_a = entry === null || entry === void 0 ? void 0 : entry.account) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.parsed) === null || _c === void 0 ? void 0 : _c.info) === null || _d === void 0 ? void 0 : _d.state) !== 'frozen'; });
    if (!validAccounts.length)
        return null;
    return validAccounts[0].pubkey;
});
exports.findGatewayToken = findGatewayToken;
//# sourceMappingURL=index.js.map