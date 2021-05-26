import chai from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import axios from "axios";
import { GatekeeperClient } from "../../src";
import { GatekeeperRecord, State } from "../../src/types";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;
const selfDeclarationTextAgreedTo = "test_selfDeclarationTextAgreedTo";
const sandbox = sinon.createSandbox();
const presentationRequestId = "test_presentationRequestId";
describe("GatekeeperClient", () => {
  afterEach(sandbox.restore);
  context("constructor", () => {
    it("should add config as an instance variable", () => {
      const baseUrl = "test_baseUrl";
      const clientInst = new GatekeeperClient({ baseUrl });
      expect(clientInst.config).to.deep.eq({ baseUrl });
    });
  });

  context("baseUrl", () => {
    it("should return the config baseUrl", () => {
      const baseUrl = "test_baseUrl";
      const clientInst = new GatekeeperClient({ baseUrl });
      expect(clientInst.baseUrl).to.eq(baseUrl);
    });
  });

  context("headers", () => {
    it("should return the config headers", () => {
      const headers = { test: "headers" };
      const baseUrl = "test_baseUrl";
      const clientInst = new GatekeeperClient({ baseUrl, headers });
      expect(clientInst.headers).to.eq(headers);
    });
  });

  context("createGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    let baseUrl: string;
    let walletPublicKey: PublicKey;

    beforeEach(() => {
      walletPublicKey = Keypair.generate().publicKey;
      baseUrl = "test_baseUrl";
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    context("with bad parameters passed", () => {
      it("should throw an error if neither a walletPublicKey or a presentationRequestId are passed", () => {
        return expect(
          gatekeeperClientInst.createGatewayToken({
            selfDeclarationTextAgreedTo,
          })
        ).to.rejectedWith(
          "walletPublicKey or a presentationRequestId must be provided in the token creation request"
        );
      });
    });

    context("with only the walletPublicKey passed", () => {
      it("should call post with an address param", async () => {
        const expectation = sandbox
          .mock(axios)
          .expects("post")
          .withArgs(`${baseUrl}`, { address: walletPublicKey.toBase58() });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.createGatewayToken({ walletPublicKey });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox.stub(axios, "post").resolves(serverResponse);
        const createGatewayTokenResponse =
          await gatekeeperClientInst.createGatewayToken({ walletPublicKey });
        expect(createGatewayTokenResponse).deep.eq(data);
      });
    });

    context("with selfDeclarationTextAgreedTo passed", () => {
      it("should call post with an address param", async () => {
        const expectation = sandbox
          .mock(axios)
          .expects("post")
          .withArgs(`${baseUrl}`, {
            selfDeclarationTextAgreedTo,
            address: walletPublicKey.toBase58(),
          });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
          selfDeclarationTextAgreedTo,
        });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox
          .stub(axios, "post")
          .withArgs(`${baseUrl}`, {
            selfDeclarationTextAgreedTo,
            address: walletPublicKey.toBase58(),
          })
          .resolves(serverResponse);
        const createGatewayTokenResponse =
          await gatekeeperClientInst.createGatewayToken({
            walletPublicKey,
            selfDeclarationTextAgreedTo,
          });
        expect(createGatewayTokenResponse).deep.eq(data);
      });
    });

    context("with a presentationRequestId passed", () => {
      it("should call post with a presentationRequestId param", async () => {
        const expectation = sandbox
          .mock(axios)
          .expects("post")
          .withArgs(`${baseUrl}`, { presentationRequestId });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
          presentationRequestId,
        });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox
          .stub(axios, "post")
          .withArgs(`${baseUrl}`, { presentationRequestId })
          .resolves(serverResponse);
        const createGatewayTokenResponse =
          await gatekeeperClientInst.createGatewayToken({
            walletPublicKey,
            presentationRequestId,
          });
        expect(createGatewayTokenResponse).deep.eq(data);
      });
    });

    context("with an error", () => {
      context("with a server response not 2xx", () => {
        it("should throw an error with statusText if present", () => {
          const statusText = "server error";
          const serverResponse = {
            response: { status: 500, statusText, data: {} },
          };
          sandbox
            .stub(axios, "post")
            .withArgs(`${baseUrl}`, { presentationRequestId })
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey,
              presentationRequestId,
            })
          ).rejectedWith(statusText);
        });

        it("data error message should take precedence over statusText if both are present", () => {
          const statusText = "server error";
          const dataErrorMessage = "Blocked IP 123";
          const serverResponse = {
            response: {
              status: 500,
              statusText,
              data: { message: dataErrorMessage },
            },
          };
          sandbox
            .stub(axios, "post")
            .withArgs(`${baseUrl}`, { presentationRequestId })
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey,
              presentationRequestId,
            })
          ).rejectedWith(dataErrorMessage);
        });

        it("should return a normal error if no data or response are present", () => {
          const error = new Error("server error");
          sandbox
            .stub(axios, "post")
            .withArgs(`${baseUrl}`, { presentationRequestId })
            .rejects(error);
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey,
              presentationRequestId,
            })
          ).rejectedWith(error.message);
        });
      });
    });
  });

  context("auditGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    let baseUrl: string;
    let gatekeeperRecord: GatekeeperRecord;
    beforeEach(() => {
      gatekeeperRecord = {
        country: "IE",
        ipAddress: "123",
        name: "test",
        timestamp: new Date().toISOString(),
        token: "test_token",
        selfDeclarationTextAgreedTo: "",
        state: State.ACTIVE,
      };
      baseUrl = "test_baseUrl";
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should do a server lookup using the token in the path", async () => {
      const token = "test_token";
      const expectation = sandbox
        .mock(axios)
        .expects("get")
        .withArgs(`${baseUrl}/${token}`);

      expectation.resolves({ status: 200 });
      await gatekeeperClientInst.auditGatewayToken(token);
      expectation.verify();
    });

    it("should return the returned gatekeeper record", async () => {
      const token = "test_token";
      sandbox
        .stub(axios, "get")
        .withArgs(`${baseUrl}/${token}`)
        .resolves({ status: 200, data: gatekeeperRecord });
      const auditGatewayTokenResponse =
        await gatekeeperClientInst.auditGatewayToken(token);
      expect(auditGatewayTokenResponse).to.deep.eq(gatekeeperRecord);
    });

    context("with an error", () => {
      const token = "error_token";
      context("with a server response not 2xx", () => {
        it("should throw an error with statusText if present", () => {
          const statusText = "server error";
          const serverResponse = {
            response: { status: 500, statusText, data: {} },
          };
          sandbox
            .stub(axios, "get")
            .withArgs(`${baseUrl}/${token}`)
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.auditGatewayToken(token)
          ).rejectedWith(statusText);
        });

        it("data error message should take precedence over statusText if both are present", () => {
          const statusText = "server error";
          const dataErrorMessage = "audit error";
          const serverResponse = {
            response: {
              status: 500,
              statusText,
              data: { message: dataErrorMessage },
            },
          };
          sandbox
            .stub(axios, "get")
            .withArgs(`${baseUrl}/${token}`)
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.auditGatewayToken(token)
          ).rejectedWith(dataErrorMessage);
        });

        it("should return a normal error if no data or response are present", () => {
          const error = new Error("server error");
          sandbox
            .stub(axios, "get")
            .withArgs(`${baseUrl}/${token}`)
            .rejects(error);
          return expect(
            gatekeeperClientInst.auditGatewayToken(token)
          ).rejectedWith(error.message);
        });
      });
    });
  });

  context("refreshGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    let baseUrl: string;

    beforeEach(() => {
      baseUrl = "test_baseUrl";
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should do a server lookup using the token in the path", async () => {
      const token = "test_token";
      const expectation = sandbox
        .mock(axios)
        .expects("patch")
        .withArgs(`${baseUrl}/${token}/refresh`);

      expectation.resolves({ status: 200 });
      await gatekeeperClientInst.refreshGatewayToken(token);
      expectation.verify();
    });

    it("should return a successful response", async () => {
      const token = "test_token";
      const expectedResponse = { status: "ok" };
      sandbox
        .stub(axios, "patch")
        .withArgs(`${baseUrl}/${token}/refresh`)
        .resolves({ status: 200, data: expectedResponse });

      const refreshTokenResponse = await gatekeeperClientInst.refreshGatewayToken(token);
      expect(refreshTokenResponse).to.deep.eq(expectedResponse);
    });

    it("should throw an error with statusText if present", () => {
      const statusText = "server error";
      const token = "test_token";
      const serverResponse = {
        response: { status: 500, statusText, data: {} },
      };
      sandbox
        .stub(axios, "patch")
        .withArgs(`${baseUrl}/${token}/refresh`)
        .rejects(serverResponse);
      return expect(
        gatekeeperClientInst.refreshGatewayToken(token)
      ).rejectedWith(statusText);
    });

    it("data error message should take precedence over statusText if both are present", () => {
      const statusText = "server error";
      const token = "test_token";
      const dataErrorMessage = "refresh error";
      const serverResponse = {
        response: {
          status: 500,
          statusText,
          data: { message: dataErrorMessage },
        },
      };
      sandbox
        .stub(axios, "patch")
        .withArgs(`${baseUrl}/${token}/refresh`)
        .rejects(serverResponse);
      return expect(
        gatekeeperClientInst.refreshGatewayToken(token)
      ).rejectedWith(dataErrorMessage);
    });

    it("should return a normal error if no data or response are present", () => {
      const error = new Error("server error");
      const token = "test_token";
      sandbox
        .stub(axios, "patch")
        .withArgs(`${baseUrl}/${token}/refresh`)
        .rejects(error);
      return expect(
        gatekeeperClientInst.refreshGatewayToken(token)
      ).rejectedWith(error.message);
    });
  });

  context("requestAirdrop", () => {
    let gatekeeperClientInst: GatekeeperClient;
    let baseUrl: string;
    let walletPublicKey: PublicKey;

    beforeEach(() => {
      walletPublicKey = Keypair.generate().publicKey;
      baseUrl = "test_baseUrl";
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should make a server POST request using the wallet public key", async () => {
      const expectation = sandbox
        .mock(axios)
        .expects("post")
        .withArgs(`${baseUrl}/airdrop`, {
          address: walletPublicKey.toBase58(),
        });

      expectation.resolves({ status: 200 });
      await gatekeeperClientInst.requestAirdrop(walletPublicKey);
      expectation.verify();
    });

    it("should return undefined", async () => {
      const serverResponse = { status: 200 };
      sandbox
        .stub(axios, "post")
        .withArgs(`${baseUrl}/airdrop`, { address: walletPublicKey.toBase58() })
        .resolves(serverResponse);

      const requestAirdropResponse = await gatekeeperClientInst.requestAirdrop(
        walletPublicKey
      );
      expect(requestAirdropResponse).to.eq(undefined);
    });
  });
});
