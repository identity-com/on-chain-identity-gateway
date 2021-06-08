import chai from "chai";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import axios from "axios";
import { GatekeeperClient, GatekeeperRecord, State } from "../../src";
import { SignCallback } from "@identity.com/prove-solana-wallet";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;
const selfDeclarationTextAgreedTo = "test_selfDeclarationTextAgreedTo";
const sandbox = sinon.createSandbox();
const presentationRequestId = "test_presentationRequestId";

describe("GatekeeperClient", () => {
  let walletPublicKey: PublicKey;
  let signer: SignCallback;

  beforeEach(() => {
    const wallet = Keypair.generate();
    walletPublicKey = wallet.publicKey;
    signer = async (transaction: Transaction) => {
      transaction.sign(wallet);
      return transaction;
    };
  });

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

    beforeEach(() => {
      baseUrl = "test_baseUrl";
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    context("with only the walletPublicKey passed", () => {
      it("should call post with an address param", async () => {
        const expectation = sandbox
          .mock(axios)
          .expects("request")
          .withArgs({
            method: "POST",
            url: `${baseUrl}`,
            data: {
              address: walletPublicKey.toBase58(),
              proof: sinon.match.string,
            },
          });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
          signer,
        });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox.stub(axios, "request").resolves(serverResponse);
        const createGatewayTokenResponse =
          await gatekeeperClientInst.createGatewayToken({
            walletPublicKey,
            signer,
          });
        expect(createGatewayTokenResponse).deep.eq(data);
      });
    });

    context("with selfDeclarationTextAgreedTo passed", () => {
      it("should call post with an address param", async () => {
        const expectation = sandbox
          .mock(axios)
          .expects("request")
          .withArgs({
            method: "POST",
            url: `${baseUrl}`,
            data: {
              selfDeclarationTextAgreedTo,
              address: walletPublicKey.toBase58(),
              proof: sinon.match.string,
            },
          });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
          selfDeclarationTextAgreedTo,
          signer,
        });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox
          .stub(axios, "request")
          .withArgs({
            method: "POST",
            url: `${baseUrl}`,
            data: {
              selfDeclarationTextAgreedTo,
              address: walletPublicKey.toBase58(),
              proof: sinon.match.string,
            },
          })
          .resolves(serverResponse);
        const createGatewayTokenResponse =
          await gatekeeperClientInst.createGatewayToken({
            walletPublicKey,
            selfDeclarationTextAgreedTo,
            signer,
          });
        expect(createGatewayTokenResponse).deep.eq(data);
      });
    });

    context("with a presentationRequestId passed", () => {
      it("should call post with a presentationRequestId param", async () => {
        const expectation = sandbox
          .mock(axios)
          .expects("request")
          .withArgs({
            method: "POST",
            url: `${baseUrl}`,
            data: {
              presentationRequestId,
              proof: sinon.match.string,
            },
          });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.createGatewayToken({
          walletPublicKey,
          presentationRequestId,
          signer,
        });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox
          .stub(axios, "request")
          .withArgs({
            method: "POST",
            url: `${baseUrl}`,
            data: {
              presentationRequestId,
              proof: sinon.match.string,
            },
          })
          .resolves(serverResponse);
        const createGatewayTokenResponse =
          await gatekeeperClientInst.createGatewayToken({
            walletPublicKey,
            presentationRequestId,
            signer,
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
            .stub(axios, "request")
            .withArgs({
              method: "POST",
              url: `${baseUrl}`,
              data: {
                presentationRequestId,
                proof: sinon.match.string,
              },
            })
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey,
              presentationRequestId,
              signer,
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
            .stub(axios, "request")
            .withArgs({
              method: "POST",
              url: `${baseUrl}`,
              data: {
                presentationRequestId,
                proof: sinon.match.string,
              },
            })
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey,
              presentationRequestId,
              signer,
            })
          ).rejectedWith(dataErrorMessage);
        });

        it("should return a normal error if no data or response are present", () => {
          const error = new Error("server error");
          sandbox
            .stub(axios, "request")
            .withArgs({
              method: "POST",
              url: `${baseUrl}`,
              data: {
                presentationRequestId,
                proof: sinon.match.string,
              },
            })
            .rejects(error);
          return expect(
            gatekeeperClientInst.createGatewayToken({
              walletPublicKey,
              presentationRequestId,
              signer,
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

  context("revokeGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    const baseUrl = "test_baseUrl";
    const token = Keypair.generate().publicKey;
    const tokenUrl = `${baseUrl}/${token.toBase58()}`;

    beforeEach(() => {
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should call the token endpoint with DELETE verb", async () => {
      const expectation = sandbox.mock(axios).expects("request").withArgs({
        method: "DELETE",
        url: tokenUrl,
        data: {},
      });

      expectation.resolves({ status: 200 });
      const revokeResponse = await gatekeeperClientInst.revokeGatewayToken(
        token.toBase58()
      );
      expectation.verify();
    });

    it("should return delete response from server as boolean", async () => {
      const data = { status: "ok" };
      const serverResponse = { status: 200, data };
      sandbox.stub(axios, "request").resolves(serverResponse);
      const revokeResponse = await gatekeeperClientInst.revokeGatewayToken(
        token.toBase58()
      );
      expect(revokeResponse).to.be.true;
    });
  });

  const expectPatchWithState = (
    token: PublicKey,
    state: string
  ): sinon.SinonExpectation => {
    const baseUrl = "test_baseUrl";
    const tokenUrl = `${baseUrl}/${token.toBase58()}`;
    return sandbox
      .mock(axios)
      .expects("request")
      .withArgs({
        method: "PATCH",
        url: `${tokenUrl}`,
        data: {
          state,
        },
      });
  };

  context("freezeGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    const baseUrl = "test_baseUrl";
    const token = Keypair.generate().publicKey;

    beforeEach(() => {
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should call the token endpoint with PATCH verb and state: 'FROZEN'", async () => {
      const expectation = expectPatchWithState(token, "FROZEN");
      expectation.resolves({ status: 200 });
      const response = await gatekeeperClientInst.freezeGatewayToken(
        token.toBase58()
      );
      expectation.verify();
    });

    it("should return PATCH response from server as boolean", async () => {
      const data = { status: "ok" };
      const serverResponse = { status: 200, data };
      sandbox.stub(axios, "request").resolves(serverResponse);
      const freezeResponse = await gatekeeperClientInst.freezeGatewayToken(
        token.toBase58()
      );
      expect(freezeResponse).to.be.true;
    });
  });

  context("unfreezeGatewayToken", () => {
    const baseUrl = "test_baseUrl";
    let gatekeeperClientInst: GatekeeperClient;

    const token = Keypair.generate().publicKey;

    beforeEach(() => {
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should call the token endpoint with PATCH verb and state: 'ACTIVE'", async () => {
      const expectation = expectPatchWithState(token, "ACTIVE");
      expectation.resolves({ status: 200 });
      const response = await gatekeeperClientInst.unfreezeGatewayToken(
        token.toBase58()
      );
      expectation.verify();
    });

    it("should return PATCH response from server as boolean", async () => {
      const data = { status: "ok" };
      const serverResponse = { status: 200, data };
      sandbox.stub(axios, "request").resolves(serverResponse);
      const unfreezeResponse = await gatekeeperClientInst.unfreezeGatewayToken(
        token.toBase58()
      );
      expect(unfreezeResponse).to.be.true;
    });
  });

  context("refreshGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    const baseUrl = "test_baseUrl";
    const token = Keypair.generate().publicKey;
    const refreshUrl = `${baseUrl}/${token.toBase58()}/refresh`;

    beforeEach(() => {
      gatekeeperClientInst = new GatekeeperClient({ baseUrl });
    });

    it("should call the refresh endpoint with the token in the path", async () => {
      const expectation = sandbox
        .mock(axios)
        .expects("request")
        .withArgs({
          method: "PATCH",
          url: refreshUrl,
          data: {
            proof: sinon.match.string,
          },
        });

      expectation.resolves({ status: 200 });
      await gatekeeperClientInst.refreshGatewayToken({
        token,
        wallet: walletPublicKey,
        signer,
      });
      expectation.verify();
    });

    it("should throw an error with statusText if present", () => {
      const statusText = "server error";
      const serverResponse = {
        response: { status: 500, statusText, data: {} },
      };
      sandbox
        .stub(axios, "request")
        .withArgs({
          method: "PATCH",
          url: refreshUrl,
          data: {
            proof: sinon.match.string,
          },
        })
        .rejects(serverResponse);
      return expect(
        gatekeeperClientInst.refreshGatewayToken({
          token,
          wallet: walletPublicKey,
          signer,
        })
      ).rejectedWith(statusText);
    });

    it("data error message should take precedence over statusText if both are present", () => {
      const statusText = "server error";
      const dataErrorMessage = "refresh error";
      const serverResponse = {
        response: {
          status: 500,
          statusText,
          data: { message: dataErrorMessage },
        },
      };
      sandbox
        .stub(axios, "request")
        .withArgs({
          method: "PATCH",
          url: refreshUrl,
          data: {
            proof: sinon.match.string,
          },
        })
        .rejects(serverResponse);
      return expect(
        gatekeeperClientInst.refreshGatewayToken({
          token,
          wallet: walletPublicKey,
          signer,
        })
      ).rejectedWith(dataErrorMessage);
    });

    it("should return a normal error if no data or response are present", () => {
      const error = new Error("server error");
      sandbox
        .stub(axios, "request")
        .withArgs({
          method: "PATCH",
          url: refreshUrl,
          data: {
            proof: sinon.match.string,
          },
        })
        .rejects(error);
      return expect(
        gatekeeperClientInst.refreshGatewayToken({
          token,
          wallet: walletPublicKey,
          signer,
        })
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
        .expects("request")
        .withArgs({
          method: "POST",
          url: `${baseUrl}/airdrop`,
          data: {
            address: walletPublicKey.toBase58(),
          },
        });

      expectation.resolves({ status: 200 });
      await gatekeeperClientInst.requestAirdrop(walletPublicKey);
      expectation.verify();
    });

    it("should return undefined", async () => {
      const serverResponse = { status: 200 };
      sandbox
        .stub(axios, "request")
        .withArgs({
          method: "POST",
          url: `${baseUrl}/airdrop`,
          data: {
            address: walletPublicKey.toBase58(),
          },
        })
        .resolves(serverResponse);

      const requestAirdropResponse = await gatekeeperClientInst.requestAirdrop(
        walletPublicKey
      );
      expect(requestAirdropResponse).to.eq(undefined);
    });
  });
});
