import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { GatewayV2 } from "../target/types/gateway_v2";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const expect = chai.expect;

describe("network operations", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GatewayV2 as Program<GatewayV2>;
  const createAccount = async (baseAccount) => {
    await program.methods
      .createNetwork({
        authThreshold: new anchor.BN(1),
        passExpireTime: new anchor.BN(360),
        networkDataLen: new anchor.BN(16),
        signerBump: new anchor.BN(3),
        fees: [
          {
            token: baseAccount.publicKey,
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
        network: baseAccount.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([baseAccount])
      .rpc();

    return program.account.gatekeeperNetwork.fetch(baseAccount.publicKey);
  };

  it("create an account", async () => {
    const baseAccount = anchor.web3.Keypair.generate();

    const account = await createAccount(baseAccount);

    expect(account).to.deep.equal({
      version: 0,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      networkDataLen: 16,
      signerBump: 3,
      feesCount: 1,
      authKeysCount: 1,
      fees: [
        {
          token: baseAccount.publicKey,
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

  it.only("adds an auth key to an account", async () => {
    const baseAccount = anchor.web3.Keypair.generate();
    await createAccount(baseAccount);
    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(1),
              key: baseAccount.publicKey,
            },
          ],
          remove: [],
        },
        passExpireTime: null,
        fees: { add: [], remove: [] },
      })
      .accounts({
        network: baseAccount.publicKey,
      })
      .signers([])
      .rpc();

    const fetchAccount = await program.account.gatekeeperNetwork.fetch(
      baseAccount.publicKey
    );
    const passExpireTime = fetchAccount.passExpireTime;

    expect(fetchAccount).to.deep.equal({
      version: 0,
      authThreshold: 1,
      passExpireTime: passExpireTime,
      networkDataLen: 16,
      signerBump: 3,
      feesCount: 1,
      authKeysCount: 2,
      fees: [
        {
          token: baseAccount.publicKey,
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
          key: baseAccount.publicKey,
        },
      ],
    });
  });

  it("removes an auth key to an account", async () => {
    const baseAccount = anchor.web3.Keypair.generate();

    await createAccount(baseAccount);

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(1),
              key: baseAccount.publicKey,
            },
          ],
          remove: [],
        },
        fees: {
          add: [],
          remove: [],
        },
      })
      .accounts({
        network: baseAccount.publicKey,
      })
      .signers([])
      .rpc();

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [],
          remove: [baseAccount.publicKey],
        },
        fees: {
          add: [],
          remove: [],
        },
      })
      .accounts({
        network: baseAccount.publicKey,
      })
      .signers([])
      .rpc();

    const account = await program.account.gatekeeperNetwork.fetch(
      baseAccount.publicKey
    );

    expect(account).to.deep.equal({
      version: 0,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      networkDataLen: 16,
      signerBump: 3,
      feesCount: 1,
      authKeysCount: 1,
      fees: [
        {
          token: baseAccount.publicKey,
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
    const baseAccount = anchor.web3.Keypair.generate();

    await createAccount(baseAccount);

    return expect(
      program.methods
        .updateNetwork({
          authKeys: {
            add: [],
            remove: [provider.wallet.publicKey],
          },
          fees: { add: [], remove: [] },
        })
        .accounts({
          network: baseAccount.publicKey,
        })
        .signers([])
        .rpc()
    ).to.eventually.be.rejected;
  });

  it("updates an auth key to an account", async () => {
    const baseAccount = anchor.web3.Keypair.generate();

    await createAccount(baseAccount);

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
      })
      .accounts({
        network: baseAccount.publicKey,
      })
      .signers([])
      .rpc();

    const account = await program.account.gatekeeperNetwork.fetch(
      baseAccount.publicKey
    );

    expect(account).to.deep.equal({
      version: 0,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      networkDataLen: 16,
      signerBump: 3,
      feesCount: 1,
      authKeysCount: 1,
      fees: [
        {
          token: baseAccount.publicKey,
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
    const baseAccount = anchor.web3.Keypair.generate();

    await createAccount(baseAccount);

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
          network: baseAccount.publicKey,
        })
        .signers([])
        .rpc()
    ).to.eventually.be.rejected;
  });

  it("adds an auth key to an account", async () => {
    const baseAccount = anchor.web3.Keypair.generate();

    await createAccount(baseAccount);

    await program.methods
      .updateNetwork({
        authKeys: {
          add: [
            {
              flags: new anchor.BN(1),
              key: baseAccount.publicKey,
            },
          ],
          remove: [],
        },
        fees: { add: [], remove: [] },
      })
      .accounts({
        network: baseAccount.publicKey,
      })
      .signers([])
      .rpc();

    const account = await program.account.gatekeeperNetwork.fetch(
      baseAccount.publicKey
    );

    expect(account).to.deep.equal({
      version: 0,
      authThreshold: 1,
      passExpireTime: new anchor.BN(360),
      networkDataLen: 16,
      signerBump: 3,
      feesCount: 1,
      authKeysCount: 2,
      fees: [
        {
          token: baseAccount.publicKey,
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
          key: baseAccount.publicKey,
        },
      ],
    });
  });
  it("closes an account", async () => {
    const baseAccount = anchor.web3.Keypair.generate();
    await provider.connection
      .getBalance(provider.wallet.publicKey)
      .then((balance) => {
        console.log(balance);
      });

    //! Check balance before run, then check balance after run... Find difference and calculate whether the fees are accurate
    //! Clean up lint errors
    await createAccount(baseAccount);

    await program.methods
      .closeNetwork()
      .accounts({
        network: baseAccount.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([])
      .rpc();

    return expect(
      program.account.gatekeeperNetwork.fetch(baseAccount.publicKey)
    ).to.eventually.be.rejected;
  });
});
