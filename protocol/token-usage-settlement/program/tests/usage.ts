import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  Program,
  Provider,
  web3,
  setProvider,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Usage } from "../target/types/usage";
import {
  deriveATA,
  deriveDelegateAndBumpSeed,
  providerFor,
} from "../src/lib/util";
import { delegate, draw, registerUsage } from "../src";

const { Keypair, SystemProgram } = web3;

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_DECIMALS = 9;

describe("usage", () => {
  // Configure the client to use the local cluster.
  const provider = Provider.local();
  setProvider(provider);

  const usageAmount = 10_000_000_000; // 10 tokens (9 decimal places)
  const epoch = 1;

  const dapp = Keypair.generate();
  const gatekeeper = Keypair.generate();
  const oracle = Keypair.generate();

  const oracleProvider = providerFor(oracle);
  const gatekeeperProvider = providerFor(gatekeeper);
  const dappProvider = providerFor(dapp);

  // This token is the currency that usage is charged in
  // Gatekeepers draw tokens from the dapp's token account
  // The token is assumed to exist - not created by the Usage program
  // Therefore the mint authority can be anyone.
  const tokenMint = Keypair.generate();
  const tokenMintAuthority = Keypair.generate();
  // The payer here can be anything - we do not use it
  const mint = new Token(
    provider.connection,
    tokenMint.publicKey,
    TOKEN_PROGRAM_ID,
    gatekeeper
  );

  // Token accounts owned by the gatekeeper (for receiving tokens)
  // and the dapp (for sending tokens)
  let gatekeeperATA: web3.PublicKey;
  let dappATA: web3.PublicKey;
  // A PDA, owned by the Usage program, which is allowed to draw funds from the
  // dapp's token account
  let delegateAccount: web3.PublicKey;

  let usageAccount: web3.PublicKey;

  const program = workspace.Usage as Program<Usage>;

  async function fund(recipient: web3.PublicKey) {
    await provider.send(
      new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: recipient,
          lamports: 5_000_000,
        })
      )
    );
  }

  before("Fund accounts", () =>
    Promise.all([
      fund(oracle.publicKey),
      fund(gatekeeper.publicKey),
      fund(dapp.publicKey),
    ])
  );

  before("Create token and token accounts", async () => {
    gatekeeperATA = await deriveATA(gatekeeper.publicKey, tokenMint.publicKey);
    dappATA = await deriveATA(dapp.publicKey, tokenMint.publicKey);

    const createMintAccountInstruction = SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey: tokenMint.publicKey,
      space: MintLayout.span,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      programId: TOKEN_PROGRAM_ID,
    });
    const initMintInstruction = Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      tokenMint.publicKey,
      TOKEN_DECIMALS,
      tokenMintAuthority.publicKey,
      tokenMintAuthority.publicKey
    );
    const createGatekeeperATAInstruction =
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenMint.publicKey,
        gatekeeperATA,
        gatekeeper.publicKey,
        provider.wallet.publicKey
      );
    const createDappATAInstruction =
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenMint.publicKey,
        dappATA,
        dapp.publicKey,
        provider.wallet.publicKey
      );
    const mintToDappInstruction = Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      tokenMint.publicKey,
      dappATA,
      tokenMintAuthority.publicKey,
      [],
      100_000_000_000
    );

    await provider.send(
      new web3.Transaction().add(
        createMintAccountInstruction,
        initMintInstruction,
        createGatekeeperATAInstruction,
        createDappATAInstruction,
        mintToDappInstruction
      ),
      [tokenMint, tokenMintAuthority]
    );

    const delegateResult = await delegate({
      dappProvider,
      oracle: oracle.publicKey,
      token: tokenMint.publicKey,
    });

    delegateAccount = delegateResult.delegateAccount;
  });

  it("registers usage", async () => {
    usageAccount = await registerUsage({
      oracleProvider,
      amount: usageAmount,
      epoch,
      dapp: dapp.publicKey,
      gatekeeper: gatekeeper.publicKey,
      program,
    });
  });

  it("draws down", async () => {
    await draw({
      gatekeeperProvider,
      epoch,
      token: tokenMint.publicKey,
      dapp: dapp.publicKey,
      oracle: oracle.publicKey,
      program,
    });

    // Load the gatekeeper balance - ensure they received the funds
    const gatekeeperTokenAccountInfo = await mint.getAccountInfo(gatekeeperATA);

    // gatekeeper has received funds
    expect(gatekeeperTokenAccountInfo.amount.toNumber()).to.equal(usageAmount);

    // usage has been marked as paid
    const usage = await program.account.usage.fetch(usageAccount);
    expect(usage.paid).to.equal(true);
  });

  it("fails to draw down usage the same epoch twice", async () => {
    const shouldFail = draw({
      gatekeeperProvider,
      epoch,
      token: tokenMint.publicKey,
      dapp: dapp.publicKey,
      oracle: oracle.publicKey,
      program,
    });

    return expect(shouldFail).to.be.rejectedWith(
      /A raw constraint was violated/
    );
  });

  it("fails to register usage for the same account twice", async () => {
    const shouldFail = registerUsage({
      oracleProvider,
      amount: usageAmount,
      epoch,
      dapp: dapp.publicKey,
      gatekeeper: gatekeeper.publicKey,
      program,
    });

    return expect(shouldFail).to.be.rejectedWith(/failed to send transaction/);
  });

  it("fails to draw down if the usage was registered by a different oracle", async () => {
    const badOracle = Keypair.generate();
    await fund(badOracle.publicKey);

    // create usage for the same epoch from a different oracle (this is allowed)
    const badOracleUsageAccount = await registerUsage({
      oracleProvider: providerFor(badOracle),
      amount: usageAmount,
      epoch,
      dapp: dapp.publicKey,
      gatekeeper: gatekeeper.publicKey,
      program,
    });

    // Try to draw with the delegate account derived from the good oracle
    const [delegate, delegate_bump] = await deriveDelegateAndBumpSeed(
      dapp.publicKey,
      oracle.publicKey
    );
    // We cannot use the client function draw() here, as that derives the delegate from the oracle passed in,
    // in other words - the client cannot misbehave in the way this test is testing.
    // This tests that the program also cannot.
    const shouldFail = program.rpc.draw(delegate_bump, {
      accounts: {
        usage: badOracleUsageAccount,
        gatekeeper: gatekeeper.publicKey,
        gatekeeperTokenAccount: gatekeeperATA,
        dappTokenAccount: dappATA,
        delegateAuthority: delegate,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [gatekeeper],
    });

    return expect(shouldFail).to.be.rejectedWith(/failed to send transaction/);
  });

  it("registers usage and draws down for the next epoch", async () => {
    const nextEpoch = epoch + 1;
    await registerUsage({
      oracleProvider,
      amount: usageAmount,
      epoch: nextEpoch,
      dapp: dapp.publicKey,
      gatekeeper: gatekeeper.publicKey,
      program,
    });

    await draw({
      gatekeeperProvider,
      epoch: nextEpoch,
      token: tokenMint.publicKey,
      dapp: dapp.publicKey,
      oracle: oracle.publicKey,
      program,
    });

    // gatekeeper has received funds twice now
    const gatekeeperTokenAccountInfo = await mint.getAccountInfo(gatekeeperATA);
    expect(gatekeeperTokenAccountInfo.amount.toNumber()).to.equal(
      usageAmount * 2
    );
  });

  it("fails to draw down for an epoch that has nothing registered", () => {
    const someEpoch = epoch - 1;

    const shouldFail = draw({
      gatekeeperProvider,
      epoch: someEpoch,
      token: tokenMint.publicKey,
      dapp: dapp.publicKey,
      oracle: oracle.publicKey,
      program,
    });

    // this error ("The given account is not owned by the executing program") is expected
    // in this case, because the PDA that is derived from the epoch, oracle and dapp has no
    // data on chain, and therefore, the "owner" is the SystemProgram by default.
    // We could consider improving the client to give a more meaningful error message here.
    return expect(shouldFail).to.be.rejectedWith(
      /The given account is not owned by the executing program/
    );
  });
});
