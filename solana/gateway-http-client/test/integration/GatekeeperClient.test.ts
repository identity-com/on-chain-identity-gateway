import chai from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import chaiSubset from "chai-subset";
import { GatekeeperClient } from "../../src";
import {
  gatekeeperServerBaseUrl,
  nonUsIPOverrideHeaders,
} from "../support/testSupport";
import { GatekeeperRecord } from "../../src/types";

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiSubset);
const { expect } = chai;

const selfDeclarationTextAgreedTo = "test_selfDeclarationTextAgreedTo";

describe("GatekeeperClient Integration tests", () => {
  let gatekeeperClientInst: GatekeeperClient;
  let walletPublicKey: PublicKey;

  beforeEach(() => {
    walletPublicKey = Keypair.generate().publicKey;
    gatekeeperClientInst = new GatekeeperClient({
      baseUrl: gatekeeperServerBaseUrl,
      headers: nonUsIPOverrideHeaders,
    });
  });
  context("createGatewayToken", () => {
    context("with a valid walletPublicKey passed", () => {
      it("should retrieve a gatekeeper record", async () => {
        const gatekeeperRecord = await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
        });
        expect(gatekeeperRecord).not.to.be.null;
      });
    });

    context("with an error", () => {
      context("with a server response not 2xx", () => {
        it("should throw an error with server message for a 500 response", () => {
          const badWalletPublicKey = { toBase58: () => "bad public key" };
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey: badWalletPublicKey as PublicKey,
            })
          ).rejectedWith("Non-base58 character");
        });
      });
    });
  });

  context("auditGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    let gatewayToken: string;
    beforeEach(async () => {
      gatekeeperClientInst = new GatekeeperClient({
        baseUrl: gatekeeperServerBaseUrl,
        headers: nonUsIPOverrideHeaders,
      });
    });

    context("with a good token and selfDeclarationTextAgreedTo", () => {
      beforeEach(async () => {
        ({
          token: gatewayToken,
        } = await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
          selfDeclarationTextAgreedTo,
        }));
      });

      it("should retrieve a gatekeeper record for the token", async () => {
        const auditResponse: GatekeeperRecord | null = await gatekeeperClientInst.auditGatewayToken(
          gatewayToken
        );
        expect(auditResponse).not.to.be.null;
        expect(auditResponse!.selfDeclarationTextAgreedTo).to.eq(
          selfDeclarationTextAgreedTo
        );
      });
    });

    context("with a bad token", () => {
      const token = "error_token";
      it("should throw an error with server message for a 500 response", () => {
        return expect(
          gatekeeperClientInst.auditGatewayToken(token)
        ).rejectedWith("Non-base58 character");
      });
    });

    context("for a token not created by the gatekeeper", () => {
      it("should throw an error with server message for a 500 response", () => {
        return expect(
          gatekeeperClientInst.auditGatewayToken(
            Keypair.generate().publicKey.toBase58()
          )
        ).rejectedWith("NoSuchKey");
      });
    });
  });

  context("requestAirdrop", () => {
    let gatekeeperClientInst: GatekeeperClient;

    beforeEach(() => {
      gatekeeperClientInst = new GatekeeperClient({
        baseUrl: gatekeeperServerBaseUrl,
        headers: nonUsIPOverrideHeaders,
      });
    });

    it("should make a server POST request using the wallet public key", async () => {
      const requestAirdropResponse = await gatekeeperClientInst.requestAirdrop(
        walletPublicKey
      );
      expect(requestAirdropResponse).to.eq(undefined);
    });
  });
});
