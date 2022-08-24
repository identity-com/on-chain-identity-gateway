import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { GatewayV2 } from "../target/types/gateway_v2";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

chai.use(chaiAsPromised);

const expect = chai.expect;

describe("network operations", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GatewayV2 as Program<GatewayV2>;

  const createAccount = async () => {
    const authority = Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      authority.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig, "confirmed");

    const [network, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("gk-network"),
        authority.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .createNetwork({
        authThreshold: new anchor.BN(1),
        passExpireTime: new anchor.BN(360),
        signerBump: new anchor.BN(3),
        fees: [
          {
            token: provider.wallet.publicKey,
            issue: new anchor.BN(100),
            refresh: new anchor.BN(100),
            expire: new anchor.BN(100),
            verify: new anchor.BN(100),
          },
        ],
        authKeys: [
          {
            flags: new anchor.BN(1),
            key: provider.wallet.publicKey,
          },
        ],
      })
      .accounts({
        network: network,
        systemProgram: anchor.web3.SystemProgram.programId,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    return {
      account: await program.account.gatekeeperNetwork.fetch(network),
      address: network,
      bump,
      authority,
    };
  };

  it("create an account", async () => {
    const { bump, account, authority } = await createAccount();

    expect(account).to.deep.equal({
      version: 0,
      initialAuthority: authority.publicKey,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      signerBump: bump,
      fees: [
        {
          token: provider.wallet.publicKey,
          issue: 100,
          refresh: 100,
          expire: 100,
          verify: 100,
        },
      ],
      authKeys: [
        {
          flags: 1,
          key: provider.publicKey,
        },
      ],
    });
  });

  it("adds an auth key to an account", async () => {
    const newKey = anchor.web3.Keypair.generate().publicKey;
    const { address, bump, authority } = await createAccount();

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(1),
              key: newKey,
            },
          ],
          remove: [],
        },
        passExpireTime: null,
        fees: { add: [], remove: [] },
      })
      .accounts({
        network: address,
      })
      .rpc();

    const fetchAccount = await program.account.gatekeeperNetwork.fetch(address);
    // const passExpireTime = fetchAccount.passExpireTime;

    expect(fetchAccount).to.deep.equal({
      version: 0,
      initialAuthority: authority.publicKey,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      signerBump: bump,
      fees: [
        {
          token: provider.publicKey,
          issue: 100,
          refresh: 100,
          expire: 100,
          verify: 100,
        },
      ],
      authKeys: [
        {
          flags: 1,
          key: provider.wallet.publicKey,
        },
        {
          flags: 1,
          key: newKey,
        },
      ],
    });

    // const rawUpdatedAccount = await provider.connection.getAccountInfo(baseAccount.publicKey);
    // const accountSizeDiff = rawUpdatedAccount.data.length - rawInitialAccount.data.length;
    // console.log(accountSizeDiff);
  });

  it("removes an auth key from an account", async () => {
    const newKey = anchor.web3.Keypair.generate();

    const { bump, address, authority } = await createAccount();

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(1),
              key: newKey.publicKey,
            },
          ],
          remove: [],
        },
        fees: { add: [], remove: [] },
        passExpireTime: null,
      })
      .accounts({
        network: address,
      })
      .rpc();

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [],
          remove: [newKey.publicKey],
        },
        fees: {
          add: [],
          remove: [],
        },
        passExpireTime: null,
      })
      .accounts({
        network: address,
      })
      .rpc();

    const account = await program.account.gatekeeperNetwork.fetch(address);

    expect(account).to.deep.equal({
      version: 0,
      initialAuthority: authority.publicKey,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      signerBump: bump,
      fees: [
        {
          token: provider.publicKey,
          issue: 100,
          refresh: 100,
          expire: 100,
          verify: 100,
        },
      ],
      authKeys: [
        {
          flags: 1,
          key: provider.publicKey,
        },
      ],
    });
  });

  it("cannot remove own account", async () => {
    const { address } = await createAccount();

    return expect(
      program.methods
        .updateNetwork({
          authKeys: {
            add: [],
            remove: [provider.wallet.publicKey],
          },
          fees: { add: [], remove: [] },
          passExpireTime: null,
        })
        .accounts({
          network: address,
        })
        .rpc()
    ).to.eventually.be.rejected;
  });

  it("updates an auth key to an account", async () => {
    const { bump, address, authority } = await createAccount();

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(3),
              key: provider.publicKey,
            },
          ],
          remove: [],
        },
        fees: { add: [], remove: [] },
        passExpireTime: null,
      })
      .accounts({
        network: address,
      })
      .signers([])
      .rpc();

    const account = await program.account.gatekeeperNetwork.fetch(address);

    expect(account).to.deep.equal({
      version: 0,
      initialAuthority: authority.publicKey,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      signerBump: bump,
      fees: [
        {
          token: provider.publicKey,
          issue: 100,
          refresh: 100,
          expire: 100,
          verify: 100,
        },
      ],
      authKeys: [
        {
          flags: 3,
          key: provider.publicKey,
        },
      ],
    });
  });

  it("cannot update to remove auth flag from account", async () => {
    const { address } = await createAccount();

    return expect(
      program.methods
        .updateNetwork({
          authKeys: {
            add: [
              {
                flags: new anchor.BN(2),
                key: provider.wallet.publicKey,
              },
            ],
            remove: [],
          },
          fees: { add: [], remove: [] },
        })
        .accounts({
          network: address,
        })
        .signers([])
        .rpc()
    ).to.eventually.be.rejected;
  });

  it("adds an auth key to an account", async () => {
    const newKey = anchor.web3.Keypair.generate();

    const { address, bump, authority } = await createAccount();

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(1),
              key: newKey.publicKey,
            },
          ],
          remove: [],
        },
        fees: { add: [], remove: [] },
        passExpireTime: null,
      })
      .accounts({
        network: address,
      })
      .signers([])
      .rpc();

    const account = await program.account.gatekeeperNetwork.fetch(address);

    expect(account).to.deep.equal({
      version: 0,
      initialAuthority: authority.publicKey,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      signerBump: bump,
      fees: [
        {
          token: provider.publicKey,
          issue: 100,
          refresh: 100,
          expire: 100,
          verify: 100,
        },
      ],
      authKeys: [
        {
          flags: 1,
          key: provider.wallet.publicKey,
        },
        {
          flags: 1,
          key: newKey.publicKey,
        },
      ],
    });
  });

  it("closes an account", async () => {
    const initialBalance = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    //! Check balance before run, then check balance after run... Find difference and calculate whether the fees are accurate
    //! Clean up lint errors
    const account = await createAccount();

    await program.methods
      .closeNetwork()
      .accounts({
        network: account.address,
        receiver: provider.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([])
      .rpc();

    return expect(program.account.gatekeeperNetwork.fetch(account.address)).to
      .eventually.be.rejected;
  });
});
