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
exports.findGatewayTokens = exports.GatekeeperClient = exports.TOKEN_PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
exports.TOKEN_PROGRAM_ID = new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const errorMessageFromResponse = (response) => {
    console.error('errorFromAxiosResponse', response);
    const errorJson = response.data;
    const errorMessage = errorJson.message || response.statusText;
    console.log('errorFromAxiosResponse', { errorJson, errorMessage });
    return errorMessage;
};
class GatekeeperClient {
    constructor(config) {
        if (!config) {
            throw new Error('No valid config provided');
        }
        this.config = config;
    }
    get baseUrl() {
        return this.config.baseUrl;
    }
    get headers() {
        return this.config.headers || {};
    }
    postGatekeeperServer(body, path = '') {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const postResponse = yield axios_1.default.post(`${this.baseUrl}${path}`, body, this.headers ? { headers: this.headers } : {});
                return postResponse.data;
            }
            catch (error) {
                if (error.response)
                    throw new Error(errorMessageFromResponse(error.response));
                throw error;
            }
        });
    }
    /**
     * This function creates gateway tokens for current connected wallet
     * If called and a gateway token already exists for this wallet, it will throw an exception
     *
     * @param {PublicKey} walletPublicKey
     * @param {string} [selfDeclarationTextAgreedTo] - the text that a user had to agree to in order to call createGatewayToken
     * @param {string} [presentationRequestId] If a Civic scope request was used to verify the identity of the trader, pass it here.
     */
    createGatewayToken({ walletPublicKey, selfDeclarationTextAgreedTo, presentationRequestId }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!walletPublicKey && !presentationRequestId)
                throw new Error('walletPublicKey or a presentationRequestId must be provided in the token creation request');
            const body = presentationRequestId
                ? { presentationRequestId }
                : { address: walletPublicKey === null || walletPublicKey === void 0 ? void 0 : walletPublicKey.toBase58() };
            const gatewayTokenCreationRequest = Object.assign(Object.assign({}, body), (selfDeclarationTextAgreedTo ? { selfDeclarationTextAgreedTo } : {}));
            console.log('Requesting a new gatekeeper token...', gatewayTokenCreationRequest);
            return this.postGatekeeperServer(gatewayTokenCreationRequest);
        });
    }
    auditGatewayToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getResponse = yield axios_1.default.get(`${this.baseUrl}/${token}`);
                return getResponse.data;
            }
            catch (error) {
                if (error.response)
                    throw new Error(errorMessageFromResponse(error.response));
                throw error;
            }
        });
    }
    requestAirdrop(walletPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Requesting airdrop to key ${walletPublicKey.toBase58()}...`);
            yield this.postGatekeeperServer({ address: walletPublicKey.toBase58() }, '/airdrop');
        });
    }
}
exports.GatekeeperClient = GatekeeperClient;
const findGatewayTokens = (connection, owner, gatekeeperKey, showRevoked = false) => __awaiter(void 0, void 0, void 0, function* () {
    const accountsResponse = yield connection.getParsedTokenAccountsByOwner(owner, {
        mint: gatekeeperKey,
    });
    if (!accountsResponse.value)
        return [];
    const toGatewayToken = (entry) => {
        var _a, _b, _c, _d;
        return ({
            programId: exports.TOKEN_PROGRAM_ID,
            publicKey: entry.pubkey,
            owner,
            gatekeeperKey: gatekeeperKey,
            isValid: ((_d = (_c = (_b = (_a = entry.account) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.parsed) === null || _c === void 0 ? void 0 : _c.info) === null || _d === void 0 ? void 0 : _d.state) !== 'frozen',
        });
    };
    return accountsResponse.value
        .map(toGatewayToken)
        .filter((gatewayToken) => gatewayToken.isValid || showRevoked);
});
exports.findGatewayTokens = findGatewayTokens;
//# sourceMappingURL=index.js.map