import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from '@project-serum/anchor';
import {BN, Program, web3} from '@project-serum/anchor';
import {ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import { Usage } from '../target/types/usage';

const { Keypair, SystemProgram } = web3;

chai.use(chaiAsPromised);
const { expect } = chai;

const TOKEN_DECIMALS = 2;

describe('usage', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.local();
  anchor.setProvider(provider);
  
  const usageAmount = 100;
  const epoch = 1;

  const dapp = Keypair.generate();
  const gatekeeper = Keypair.generate();
  const oracle = Keypair.generate();

  // This token is the currency that usage is charged in
  // Gatekeepers draw tokens from the dapp's token account
  // The token is assumed to exist - not created by the Usage program
  // Therefore the mint authority can be anyone.
  const tokenMint = Keypair.generate();
  const tokenMintAuthority = Keypair.generate();
  // The payer here can be anything - we do not use it
  const mint = new Token(provider.connection, tokenMint.publicKey, TOKEN_PROGRAM_ID, gatekeeper);

  // Token accounts owned by the gatekeeper (for receiving tokens)
  // and the dapp (for sending tokens)
  let gatekeeperATA: web3.PublicKey;
  let dappATA: web3.PublicKey;
  // A PDA, owned by the Usage program, which is allowed to draw funds from the 
  // dapp's token account
  let delegate: web3.PublicKey;

  let usageAccount: web3.PublicKey

  const program = anchor.workspace.Usage as Program<Usage>;

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

  const deriveUsageAccount = async (
    dapp: web3.PublicKey,
    gatekeeper: web3.PublicKey,
    oracle: web3.PublicKey,
    epoch: number,
  ) => {
    // the epoch is used to seed the usage account,
    // so each epoch has its own account
    // the endianness does not actually matter here, we could choose big-endian
    // as long as it is mirrored in the `seeds=[...]` macro in the RegisterUsage definition
    // in the program.
    const epochBuffer = new BN(epoch).toBuffer('le', 8)

    return web3.PublicKey.findProgramAddress(
      [
        Buffer.from("gateway_usage"),
        dapp.toBuffer(),
        gatekeeper.toBuffer(),
        oracle.toBuffer(),
        epochBuffer,
      ],
      program.programId
    );
  };

  const deriveDelegateAndBumpSeed = async (
    owner: anchor.web3.PublicKey,
    oracle: anchor.web3.PublicKey,
  ) =>
    (
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("gateway_usage_delegate"), owner.toBuffer(), oracle.toBuffer()],
        program.programId
      )
    );

  const deriveATA = async (
    owner: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ) =>
    (
      await anchor.web3.PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )[0];

  before('Fund accounts', async () => {
    // fund the oracle
    await fund(oracle.publicKey);
  });

  before('Create token and token accounts', async () => {
    gatekeeperATA = await deriveATA(gatekeeper.publicKey, tokenMint.publicKey);
    dappATA = await deriveATA(dapp.publicKey, tokenMint.publicKey);
    [delegate] = await deriveDelegateAndBumpSeed(dapp.publicKey, oracle.publicKey);
    
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
    const createGatekeeperATAInstruction = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint.publicKey,
      gatekeeperATA,
      gatekeeper.publicKey,
      provider.wallet.publicKey,
    );
    const createDappATAInstruction = Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint.publicKey,
      dappATA,
      dapp.publicKey,
      provider.wallet.publicKey,
    );
    const setDelegateInstruction = Token.createApproveInstruction(
      TOKEN_PROGRAM_ID,
      dappATA,
      delegate,
      dapp.publicKey,
      [],
      999_999_999_999,  // TODO can we make this infinite?
    );
    const mintToDappInstruction = Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      tokenMint.publicKey,
      dappATA,
      tokenMintAuthority.publicKey,
      [],
      999_999_999_999
    )

    await provider.send(
      new web3.Transaction()
        .add(
          createMintAccountInstruction,
          initMintInstruction,
          createGatekeeperATAInstruction,
          createDappATAInstruction,
          setDelegateInstruction,
          mintToDappInstruction
        ),
      [tokenMint, tokenMintAuthority, dapp]
    );
  });

  it('registers usage', async () => {
    const derivedUsageAccount = await deriveUsageAccount(
      dapp.publicKey,
      gatekeeper.publicKey,
      oracle.publicKey,
      epoch,
    )

    usageAccount = derivedUsageAccount[0];
    const bump = derivedUsageAccount[1];
    
    await program.rpc.registerUsage(new BN(usageAmount), new BN(epoch), bump, {
      accounts: {
        usage: usageAccount,
        dapp: dapp.publicKey,
        gatekeeper: gatekeeper.publicKey,
        oracle: oracle.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [oracle]
    });
  });

  it('draws down', async () => {
    // TODO Consider storing the delegate bump in the usage
    // downside would be it would have to be stored in each one
    const [delegate, delegate_bump] = await deriveDelegateAndBumpSeed(dapp.publicKey, oracle.publicKey);

    await program.rpc.draw(delegate_bump, {
      accounts: {
        usage: usageAccount,
        gatekeeper: gatekeeper.publicKey,
        gatekeeperTokenAccount: gatekeeperATA,
        dappTokenAccount: dappATA,
        delegateAuthority: delegate,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [gatekeeper]
    })

    // Load the gatekeeper balance - ensure they received the funds
    const gatekeeperTokenAccountInfo = await mint.getAccountInfo(gatekeeperATA)

    // gatekeeper has received funds
    expect(gatekeeperTokenAccountInfo.amount.toNumber()).to.equal(usageAmount)

    // usage has been marked as paid
    const usage = await program.account.usage.fetch(usageAccount)
    expect(usage.paid).to.equal(true);
  });

  it('fails to draw down usage the same epoch twice', async () => {
    const [delegate, delegate_bump] = await deriveDelegateAndBumpSeed(dapp.publicKey, oracle.publicKey);

    const shouldFail = program.rpc.draw(delegate_bump, {
      accounts: {
        usage: usageAccount,
        gatekeeper: gatekeeper.publicKey,
        gatekeeperTokenAccount: gatekeeperATA,
        dappTokenAccount: dappATA,
        delegateAuthority: delegate,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [gatekeeper]
    });

    return expect(shouldFail).to.be.rejectedWith(/A raw constraint was violated/);
  });

  it('fails to register usage for the same account twice', async () => {
    const [,bump] = await deriveUsageAccount(
      dapp.publicKey,
      gatekeeper.publicKey,
      oracle.publicKey,
      epoch,
    )

    const shouldFail = program.rpc.registerUsage(new BN(usageAmount), new BN(epoch), bump, {
      accounts: {
        usage: usageAccount,
        dapp: dapp.publicKey,
        gatekeeper: gatekeeper.publicKey,
        oracle: oracle.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [oracle]
    });

    return expect(shouldFail).to.be.rejectedWith(/failed to send transaction/);
  });

  it('fails to draw down if the usage was registered by a different oracle', async () => {
    // create usage for the same epoch from a different oracle (this is allowed)
    const badOracle = Keypair.generate();
    // fund the bad oracle
    const recipient = badOracle.publicKey;
    await fund(recipient);
    const [badOracleUsageAccount, bump] = await deriveUsageAccount(
      dapp.publicKey,
      gatekeeper.publicKey,
      badOracle.publicKey,
      epoch,
    );
    await program.rpc.registerUsage(new BN(usageAmount), new BN(epoch), bump, {
      accounts: {
        usage: badOracleUsageAccount,
        dapp: dapp.publicKey,
        gatekeeper: gatekeeper.publicKey,
        oracle: badOracle.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [badOracle]
    });
    
    // try to draw with the delegate account derived from the good oracle
    const [delegate, delegate_bump] = await deriveDelegateAndBumpSeed(dapp.publicKey, oracle.publicKey);
    const shouldFail = program.rpc.draw(delegate_bump, {
      accounts: {
        usage: badOracleUsageAccount,
        gatekeeper: gatekeeper.publicKey,
        gatekeeperTokenAccount: gatekeeperATA,
        dappTokenAccount: dappATA,
        delegateAuthority: delegate,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [gatekeeper]
    })

    return expect(shouldFail).to.be.rejectedWith(/failed to send transaction/);
  });

  it('registers usage and draws down for the next epoch', async () => {
    const nextEpoch = epoch + 1;
    const [usageAccountEpoch2, bumpEpoch2] = await deriveUsageAccount(
      dapp.publicKey,
      gatekeeper.publicKey,
      oracle.publicKey,
      nextEpoch,
    )
    await program.rpc.registerUsage(new BN(usageAmount), new BN(nextEpoch), bumpEpoch2, {
      accounts: {
        usage: usageAccountEpoch2,
        dapp: dapp.publicKey,
        gatekeeper: gatekeeper.publicKey,
        oracle: oracle.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [oracle]
    });

    const [delegate, delegate_bump] = await deriveDelegateAndBumpSeed(dapp.publicKey, oracle.publicKey);
    await program.rpc.draw(delegate_bump, {
      accounts: {
        usage: usageAccountEpoch2,
        gatekeeper: gatekeeper.publicKey,
        gatekeeperTokenAccount: gatekeeperATA,
        dappTokenAccount: dappATA,
        delegateAuthority: delegate,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [gatekeeper]
    })

    // gatekeeper has received funds twice now
    const gatekeeperTokenAccountInfo = await mint.getAccountInfo(gatekeeperATA)
    expect(gatekeeperTokenAccountInfo.amount.toNumber()).to.equal(usageAmount * 2)
  });
});
