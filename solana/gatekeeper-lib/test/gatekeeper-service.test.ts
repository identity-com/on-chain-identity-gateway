import chai from "chai";
import mocha from "mocha";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiSubset from "chai-subset";
import chaiAsPromised from "chai-as-promised";
import {Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,} from "@solana/web3.js";
import {PROGRAM_ID} from "../src/util/constants";
import * as GatewayTs from "@identity.com/solana-gateway-ts";
import {
  GatewayToken,
  GatewayTokenData,
  GatewayTokenState,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
  State,
} from "@identity.com/solana-gateway-ts";
import {
  GatekeeperService,
  SendableDataTransaction,
  SendableTransaction,
  SentTransaction,
  SimpleGatekeeperService,
  Action
} from "../src";
import {Active} from "@identity.com/solana-gateway-ts/dist/lib/GatewayTokenData";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(chaiAsPromised);
const { expect } = chai;
const { describe } = mocha;
const sandbox = sinon.createSandbox();

export const dummyBlockhash = "AvrGUhLXH2JTNA3AAsmhdXJTuHJYBUz5mgon26u8M85X";

const sendAndConfirm = async (
  transaction: SendableDataTransaction<GatewayToken>
) => {
  const send = await transaction.send();
  return send.confirm();
};

describe("GatekeeperService", () => {
  let gatekeeperService: GatekeeperService;
  let simpleGatekeeperService: SimpleGatekeeperService;
  let connection: Connection;
  let tokenOwner: Keypair;
  let gatekeeperNetwork: Keypair;
  let gatekeeperAuthority: Keypair;
  let activeGatewayToken: GatewayToken;
  let revokedGatewayToken: GatewayToken;
  let gatewayTokenAddress: PublicKey;

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    tokenOwner = Keypair.generate();
    gatekeeperNetwork = Keypair.generate();
    gatekeeperAuthority = Keypair.generate();

    gatewayTokenAddress =
      getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        tokenOwner.publicKey,
        gatekeeperNetwork.publicKey
      );

    activeGatewayToken = new GatewayToken(
      Keypair.generate().publicKey, // Gatekeeper account
      gatekeeperNetwork.publicKey,
      tokenOwner.publicKey,
      State.ACTIVE,
      gatewayTokenAddress,
      PROGRAM_ID
    );
    connection = {
      getRecentBlockhash: async () => {
        return Promise.resolve({ blockhash: dummyBlockhash });
      },
      sendRawTransaction: async () => {
        return Promise.resolve(
          "5cuE6h5EdvCHbhdgPYitnZLSrnWrH82nzisNG3AAAoa1T3A3GyYbWgoUShCgAD68Jd283jFLxR95FmrS7fXXvEHm"
        );
      },
      confirmTransaction: async () => {
        return Promise.resolve({ value: { err: null } });
      },
      getAccountInfo: async () => {
        return Promise.resolve({
          data: new GatewayTokenData({
            owner: GatewayTs.AssignablePublicKey.fromPublicKey(
              activeGatewayToken.owner
            ),
            issuingGatekeeper: GatewayTs.AssignablePublicKey.fromPublicKey(
              activeGatewayToken.issuingGatekeeper
            ),
            gatekeeperNetwork: GatewayTs.AssignablePublicKey.fromPublicKey(
              activeGatewayToken.gatekeeperNetwork
            ),
            state: new GatewayTokenState({ active: new Active({}) }),
            features: [0],
            parentGatewayToken: null,
            ownerIdentity: null,
            expiry: null,
          }).encode(),
        });
      },
    } as unknown as Connection; // The connection won't be called as we're stubbing at a higher level.
    revokedGatewayToken = activeGatewayToken.update({ state: State.REVOKED });
    gatekeeperService = new GatekeeperService(
      connection,
      gatekeeperNetwork.publicKey,
      gatekeeperAuthority
    );
    simpleGatekeeperService = new SimpleGatekeeperService(
      connection,
      gatekeeperNetwork.publicKey,
      gatekeeperAuthority
    );
  });

  const instructionSigner = (instruction: TransactionInstruction):PublicKey | undefined => 
    instruction.keys.find(k => k.isSigner)?.pubkey

  const stubSend = <T>(sendableTransaction: SendableTransaction, result: T) => {
    const sentTransaction = new SentTransaction(connection, "");
    const dataTransaction = sentTransaction.withData(result);
    sandbox.stub(sentTransaction, "withData").returns(dataTransaction);
    sandbox.stub(sentTransaction, "confirm").resolves();
    sandbox.stub(dataTransaction, "confirm").resolves(result);
    return sandbox.stub(sendableTransaction, "send").resolves(sentTransaction);
  };

  it("SendableTransaction serialization", async () => {
    const keypair1 = Keypair.generate();
    const keypair2 = Keypair.generate();
    const transfer = SystemProgram.transfer({
      fromPubkey: keypair1.publicKey,
      toPubkey: keypair2.publicKey,
      lamports: 10,
    });
    const transaction = new SendableTransaction(connection, new Transaction());
    transaction.transaction.add(transfer);
    transaction.transaction.feePayer = keypair2.publicKey;
    transaction.transaction.recentBlockhash = await connection
      .getRecentBlockhash("confirmed")
      .then((rbh) => rbh.blockhash);
    transaction.partialSign(keypair1);
    const serialized = transaction.transaction.serialize({
      requireAllSignatures: false,
    });

    const newTransaction = SendableTransaction.fromSerialized(
      connection,
      serialized
    );
    expect(newTransaction.transaction.verifySignatures()).to.be.false;
    newTransaction.partialSign(keypair2);
    expect(newTransaction.transaction.verifySignatures()).to.be.true;
  });

  context("issue", () => {
    context("with send resolving success", () => {
      it("should return new gateway token", async () => {
        const issueResult = await gatekeeperService.issue(tokenOwner.publicKey);
        stubSend(issueResult.sendableTransaction, activeGatewayToken);
        const result = await issueResult.send().then((t) => t.confirm());
        return expect(result).to.equal(activeGatewayToken);
      });
    });
    context("with send rejecting with an error", () => {
      it("should throw an error", async () => {
        const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
        sandbox
          .stub(transaction, "send")
          .rejects(new Error("Transaction simulation failed"));
        return expect(transaction.send()).to.be.rejectedWith(
          /Transaction simulation failed/
        );
      });
    });
    
    context("with a charge",() => {
      it("should charge the fee payer in lamports", async () => {
        const expectedChargeRecipient = Keypair.generate();
        const gatekeeperServiceWithCharge =
          new GatekeeperService(
            connection,
            gatekeeperNetwork.publicKey,
            gatekeeperAuthority,
            {
              feePayer: expectedChargeRecipient.publicKey,
              chargeOptions: {
                [Action.ISSUE]: {
                  amount: 10,
                  chargePayer: 'FEE_PAYER',
                  recipient: gatekeeperAuthority.publicKey,
                }
              }
            }
          );

        const tx = await gatekeeperServiceWithCharge.issue(tokenOwner.publicKey);
        const chargeInstruction = tx.transaction.instructions[1];
        
        expect(instructionSigner(chargeInstruction)?.toBase58()).to.equal(expectedChargeRecipient.publicKey.toBase58());
      });

      it("should not charge the fee payer if the fee payer is the gatekeeper", async () => {
        const gatekeeperServiceWithCharge =
          new GatekeeperService(
            connection,
            gatekeeperNetwork.publicKey,
            gatekeeperAuthority,
            {
              // no configured fee payer
              chargeOptions: {
                [Action.ISSUE]: {
                  amount: 10,
                  chargePayer: 'FEE_PAYER',
                  recipient: gatekeeperAuthority.publicKey,
                }
              }
            }
          );

        const tx = await gatekeeperServiceWithCharge.issue(tokenOwner.publicKey);
        expect(tx.transaction.instructions.length).to.equal(1);
      });

      it("should charge the rent payer in lamports", async () => {
        const expectedChargeRecipient = Keypair.generate();
        const gatekeeperServiceWithCharge =
          new GatekeeperService(
            connection,
            gatekeeperNetwork.publicKey,
            gatekeeperAuthority,
            {
              rentPayer: expectedChargeRecipient.publicKey,
              chargeOptions: {
                [Action.ISSUE]: {
                  amount: 10,
                  chargePayer: 'RENT_PAYER',
                  recipient: gatekeeperAuthority.publicKey,
                }
              }
            }
          );

        const tx = await gatekeeperServiceWithCharge.issue(tokenOwner.publicKey);
        const chargeInstruction = tx.transaction.instructions[1];

        expect(instructionSigner(chargeInstruction)?.toBase58()).to.equal(expectedChargeRecipient.publicKey.toBase58());
      });

      it("should not charge the rent payer if the rent payer is the gatekeeper", async () => {
        const gatekeeperServiceWithCharge =
          new GatekeeperService(
            connection,
            gatekeeperNetwork.publicKey,
            gatekeeperAuthority,
            {
              // no configured rent payer
              chargeOptions: {
                [Action.ISSUE]: {
                  amount: 10,
                  chargePayer: 'RENT_PAYER',
                  recipient: gatekeeperAuthority.publicKey,
                }
              }
            }
          );

        const tx = await gatekeeperServiceWithCharge.issue(tokenOwner.publicKey);
        expect(tx.transaction.instructions.length).to.equal(1);
      });

      it("should charge the fee payer in SPL Token", async () => {
        const expectedChargeRecipient = Keypair.generate();
        const splTokenMint = Keypair.generate().publicKey;
        
        const gatekeeperServiceWithCharge =
          new GatekeeperService(
            connection,
            gatekeeperNetwork.publicKey,
            gatekeeperAuthority,
            {
              feePayer: expectedChargeRecipient.publicKey,
              chargeOptions: {
                [Action.ISSUE]: {
                  amount: 10,
                  chargePayer: 'FEE_PAYER',
                  recipient: gatekeeperAuthority.publicKey,
                  splTokenMint
                }
              }
            }
          );

        const tx = await gatekeeperServiceWithCharge.issue(tokenOwner.publicKey);
        const chargeInstruction = tx.transaction.instructions[1];
        
        expect(chargeInstruction.programId.toBase58()).to.equal(TOKEN_PROGRAM_ID.toBase58());
        expect(instructionSigner(chargeInstruction)?.toBase58()).to.equal(expectedChargeRecipient.publicKey.toBase58());
      });
    })
  });

  context("sendIssue", () => {
    context("with send resolving success", () => {
      it("should return new gateway token", async () => {
        const issueResult = await simpleGatekeeperService.issue(
          tokenOwner.publicKey
        );
        return expect(issueResult).to.eql(activeGatewayToken);
      });
    });
  });

  context("freeze", () => {
    context("with a previously Active token existing on-chain", () => {
      context("with the freeze blockchain call succeeding", () => {
        it("should resolve with a FROZEN token", async () => {
          const transaction = await gatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            state: State.FROZEN,
          });
          const result = await sendAndConfirm(transaction);
          return expect(result).to.containSubset({
            state: State.FROZEN,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("sendFreeze", () => {
    context("with a previously Active token existing on-chain", () => {
      context("with the freeze blockchain call succeeding", () => {
        it("should resolve with a FROZEN token", async () => {
          const transaction = await simpleGatekeeperService.freeze(
            activeGatewayToken.publicKey
          );
          return expect(transaction).to.eql(activeGatewayToken);
        });
      });
    });
  });

  context("unfreeze", () => {
    context("with a previously Frozen token existing on-chain", () => {
      context("with the unfreeze blockchain call succeeding", () => {
        it("should resolve with a ACTIVE token", async () => {
          const transaction = await gatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            state: State.ACTIVE,
          });
          const result = await sendAndConfirm(transaction);
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("sendUnfreeze", () => {
    context("with a previously Frozen token existing on-chain", () => {
      context("with the unfreeze blockchain call succeeding", () => {
        it("should resolve with a ACTIVE token", async () => {
          const transaction = await simpleGatekeeperService.unfreeze(
            activeGatewayToken.publicKey
          );
          return expect(transaction).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
          });
        });
      });
    });
  });

  context("revoke", () => {
    context("with a previously Active token existing on-chain", () => {
      context("with the revoke blockchain call succeeding", () => {
        it("should resolve with a REVOKED token", async () => {
          const transaction = await gatekeeperService.revoke(
            revokedGatewayToken.publicKey
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            state: State.REVOKED,
          });
          const result = await sendAndConfirm(transaction);
          return expect(result).to.containSubset({
            state: State.REVOKED,
            publicKey: revokedGatewayToken.publicKey,
          });
        });
      });
      context("with the revoke blockchain call failing", () => {
        it("should throw an error", async () => {
          const transaction = await gatekeeperService.revoke(
            tokenOwner.publicKey
          );
          sandbox
            .stub(transaction, "send")
            .rejects(new Error("Transaction simulation failed"));
          return expect(transaction.send()).to.be.rejectedWith(
            /Transaction simulation failed/
          );
        });
      });
    });
  });

  context("sendRevoke", () => {
    context("with a previously Active token existing on-chain", () => {
      context("with the revoke blockchain call succeeding", () => {
        it("should resolve with a REVOKED token", async () => {
          const transaction = await simpleGatekeeperService.revoke(
            revokedGatewayToken.publicKey
          );
          return expect(transaction).to.eql(activeGatewayToken);
        });
      });
    });
  });

  context("updateExpiry", () => {
    context("with a previously Active token existing on-chain", () => {
      context("with the update blockchain call succeeding", () => {
        const newExpiry = 123_456;
        it("should resolve with the updated expiry token", async () => {
          const transaction = await gatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            newExpiry
          );
          stubSend(transaction.sendableTransaction, {
            ...activeGatewayToken,
            expiryTime: newExpiry,
          });
          const result = await sendAndConfirm(transaction);
          return expect(result).to.containSubset({
            state: State.ACTIVE,
            publicKey: activeGatewayToken.publicKey,
            expiryTime: newExpiry,
          });
        });
      });
      context("with the update blockchain call failing", () => {
        // eslint-disable-next-line @typescript-eslint/require-await
        it("should resolve with the ACTIVE token with the updated expiry", async () => {
          return activeTokenResolution();
        });
      });
    });
  });

  const activeTokenResolution = () => {
    it("should throw an error", async () => {
      const transaction = await gatekeeperService.updateExpiry(
        tokenOwner.publicKey,
        123_456
      );
      sandbox
        .stub(transaction, "send")
        .rejects(new Error("Transaction simulation failed"));
      return expect(transaction.send()).to.be.rejectedWith(
        /Transaction simulation failed/
      );
    });
  };

  context("sendUpdateExpiry", () => {
    context("with a previously Active token existing on-chain", () => {
      context("with the update blockchain call succeeding", () => {
        const newExpiry = 123_456;
        it("should resolve with the updated expiry token", async () => {
          const transaction = await simpleGatekeeperService.updateExpiry(
            revokedGatewayToken.publicKey,
            newExpiry
          );
          return expect(transaction).to.eql(activeGatewayToken);
        });
      });
    });
  });

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const expectValidGatewayTransaction = (transaction: Transaction) => {
    expect(transaction).to.be.an.instanceOf(Transaction);
    expect(transaction.instructions[0].programId.toBase58()).to.eq(
      PROGRAM_ID.toBase58()
    );
    expect(transaction.recentBlockhash).to.be.a("string");
  };

  context("buildIssueTransaction", () => {
    it("should return a valid transaction", async () => {
      const buildResponse = await gatekeeperService.issue(tokenOwner.publicKey);

      expectValidGatewayTransaction(buildResponse.transaction);
    });
  });

  context("buildUpdateExpiryTransaction", () => {
    context("with the update blockchain call succeeding", () => {
      const newExpiry = 123_456;

      it("should return a valid unserialized transaction", async () => {
        const buildResponse = await gatekeeperService.updateExpiry(
          tokenOwner.publicKey,
          newExpiry
        );
        expectValidGatewayTransaction(buildResponse.transaction);
      });
    });
  });

  context("updateTransactionBlockhash", () => {
    const recentBlockhash = "BvrGUhLXH2JTNA3AAsmhdXJTuHJYBUz5mgon26u8M85X";

    it("should error if not validly signed by gatekeeper", async () => {
      const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
      transaction.transaction.signatures = [];
      expect(() =>
        gatekeeperService.updateTransactionBlockhash(transaction, {
          blockhashOrNonce: { recentBlockhash },
        })
      ).to.throw;
    });

    it("should update blockhash and sign if validly signed", async () => {
      const transaction = await gatekeeperService.issue(tokenOwner.publicKey);
      await gatekeeperService.updateTransactionBlockhash(transaction, {
        blockhashOrNonce: { recentBlockhash },
      });
      expect(transaction.transaction.recentBlockhash).to.equal(recentBlockhash);
      expect(transaction.transaction.verifySignatures()).to.be.true;
    });
  });
});
