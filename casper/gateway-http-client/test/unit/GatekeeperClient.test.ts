import chai from "chai";
import { Keypair, PublicKey, Transaction } from "@casper/web3.js";
import * as sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import axios from "axios";
import { GatekeeperClient } from "../../src";
import { SignCallback } from "@identity.com/prove-solana-wallet";
import { describe } from "mocha";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;
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

  context("requestGatewayToken", () => {
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
        await gatekeeperClientInst.requestGatewayToken({
          walletPublicKey,
          signer,
        });
        expectation.verify();
      });

      it("should return response from server", async () => {
        const data = { test: "test" };
        const serverResponse = { status: 200, data };
        sandbox.stub(axios, "request").resolves(serverResponse);
        const requestGatewayTokenResponse =
          await gatekeeperClientInst.requestGatewayToken({
            walletPublicKey,
            signer,
          });
        expect(requestGatewayTokenResponse).deep.eq(data);
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
              address: walletPublicKey.toBase58(),
              presentationRequestId,
              proof: sinon.match.string,
            },
          });

        expectation.resolves({ status: 200 });
        await gatekeeperClientInst.requestGatewayToken({
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
              address: walletPublicKey.toBase58(),
              presentationRequestId,
              proof: sinon.match.string,
            },
          })
          .resolves(serverResponse);
        const requestGatewayTokenResponse =
          await gatekeeperClientInst.requestGatewayToken({
            walletPublicKey,
            presentationRequestId,
            signer,
          });
        expect(requestGatewayTokenResponse).deep.eq(data);
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
                address: walletPublicKey.toBase58(),
                presentationRequestId,
                proof: sinon.match.string,
              },
            })
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.requestGatewayToken({
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
                address: walletPublicKey.toBase58(),
                presentationRequestId,
                proof: sinon.match.string,
              },
            })
            .rejects(serverResponse);
          return expect(
            gatekeeperClientInst.requestGatewayToken({
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
                address: walletPublicKey.toBase58(),
                presentationRequestId,
                proof: sinon.match.string,
              },
            })
            .rejects(error);
          return expect(
            gatekeeperClientInst.requestGatewayToken({
              walletPublicKey,
              presentationRequestId,
              signer,
            })
          ).rejectedWith(error.message);
        });
      });
    });
  });

  context("refreshGatewayToken", () => {
    let gatekeeperClientInst: GatekeeperClient;
    const baseUrl = "test_baseUrl";
    const token = Keypair.generate().publicKey;
    let refreshUrl: string;

    beforeEach(() => {
      refreshUrl = `${baseUrl}/${walletPublicKey.toBase58()}/refresh`;
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
