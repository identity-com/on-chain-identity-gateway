# anchor notes

## Project Structure
```
.
+-- other rust projects
|   +-- ...
+-- programs
|   +-- program1
|   |   +-- src         // Rust source files
|   |   |   +-- ...
|   |   +-- tests       // Rust integration test files
|   |   |   +-- ...
|   |   +-- Cargo.toml  // Rust project definition
|   +-- program2
|       +-- ...
+-- target      // Build directory for all projects
|   +-- idl     // Directory with generated functions (Intermedialte Dynamic Language)
|   |   +-- ...
|   +-- ...
+-- tests           // ts/js test files
|   +-- test_name.spec.ts   // Used if tsconfig.json is present
|   +-- test_name.js        // Used if tsconfig is not present
|   +-- ...
+-- Anchor.toml     // Program keys
+-- Cargo.toml      // Workspace definition
+-- package.json    // js/ts test dependancies
+-- tsconfig.json   // ts config
```

## Useful commands
All are run with top directory of project structure as working directory

###[`anchor build`](https://project-serum.github.io/anchor/cli/commands.html#build)
- Builds all programs in the programs directory (using `cargo build`)
- Emits idl files

### [`anchor deploy`](https://project-serum.github.io/anchor/cli/commands.html#deploy)
- Deploys every program to the cluster in `Anchor.toml`
- Deploys new copies, does not update

### [`anchor test`](https://project-serum.github.io/anchor/cli/commands.html#test)
- Builds, starts localnet, deploys to cluster, and tests with tests folder.
- Will start localnet if cluster is local
    - Do not have `solana-test-validator` running in this case, or the tests will fail

### [`anchor idl init`](https://project-serum.github.io/anchor/cli/commands.html#idl-init)
- Creates a new idl account on the blockchain
- Defaults to double the needed size to allow for later upgrades

### [`anchor idl fetch`](https://project-serum.github.io/anchor/cli/commands.html#idl-fetch)
- Fetches the idl from the blockchain
- Fetches from the cluster configured in `Anchor.toml`

## Other commands
- [`anchor upgrade`](https://project-serum.github.io/anchor/cli/commands.html#upgrade)
- [`anchor idl authority`](https://project-serum.github.io/anchor/cli/commands.html#idl-authority)
- [`anchor idl update`](https://project-serum.github.io/anchor/cli/commands.html#idl-upgrade)

## Current issues
- [`init` to initialize account](https://github.com/project-serum/anchor/issues/451)
- [on chain idl delete then resize rather than double size](https://github.com/project-serum/anchor/issues/452)
- [idl versioning](https://github.com/project-serum/anchor/issues/349)
- [compile errors on instructions](https://github.com/project-serum/anchor/issues/453)
- [allow type aliases in idl](https://github.com/project-serum/anchor/issues/455)

## Other links
- [Account attributes]()

## Example Files

### Example `Anchor.toml`
```toml
[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[clusters.devnet]
# program_name = key
multisig = "F3Uf5F61dmht1xuNNNkk3jnzj82TY56vVjVEhZALRkN"

[clusters.mainnet]
# program_name = key
multisig = "A9HAbnCwoD6f2NkZobKFf6buJoN9gUVVvX5PoUnDHS6u"
```

### Example js test file `multisig.js`
```js
const anchor = require("@project-serum/anchor");
const assert = require("assert");

describe("multisig", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Multisig;

  it("Tests the multisig program", async () => {
    const multisig = anchor.web3.Keypair.generate();
    const [
      multisigSigner,
      nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );
    const multisigSize = 200; // Big enough.

    const ownerA = anchor.web3.Keypair.generate();
    const ownerB = anchor.web3.Keypair.generate();
    const ownerC = anchor.web3.Keypair.generate();
    const ownerD = anchor.web3.Keypair.generate();
    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

    const threshold = new anchor.BN(2);
    await program.rpc.createMultisig(owners, threshold, nonce, {
      accounts: {
        multisig: multisig.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      instructions: [
        await program.account.multisig.createInstruction(
          multisig,
          multisigSize
        ),
      ],
      signers: [multisig],
    });

    let multisigAccount = await program.account.multisig(multisig.publicKey);
    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, owners);
    assert.ok(multisigAccount.ownerSetSeqno === 0);

    const pid = program.programId;
    const accounts = [
      {
        pubkey: multisig.publicKey,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: multisigSigner,
        isWritable: false,
        isSigner: true,
      },
    ];
    const newOwners = [ownerA.publicKey, ownerB.publicKey, ownerD.publicKey];
    const data = program.coder.instruction.encode("set_owners", {
      owners: newOwners,
    });

    const transaction = anchor.web3.Keypair.generate();
    const txSize = 1000; // Big enough, cuz I'm lazy.
    await program.rpc.createTransaction(pid, accounts, data, {
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        proposer: ownerA.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      instructions: [
        await program.account.transaction.createInstruction(
          transaction,
          txSize
        ),
      ],
      signers: [transaction, ownerA],
    });

    const txAccount = await program.account.transaction(transaction.publicKey);

    assert.ok(txAccount.programId.equals(pid));
    assert.deepStrictEqual(txAccount.accounts, accounts);
    assert.deepStrictEqual(txAccount.data, data);
    assert.ok(txAccount.multisig.equals(multisig.publicKey));
    assert.deepStrictEqual(txAccount.didExecute, false);
    assert.ok(txAccount.ownerSetSeqno === 0);

    // Other owner approves transactoin.
    await program.rpc.approve({
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        owner: ownerB.publicKey,
      },
      signers: [ownerB],
    });

    // Now that we've reached the threshold, send the transactoin.
    await program.rpc.executeTransaction({
      accounts: {
        multisig: multisig.publicKey,
        multisigSigner,
        transaction: transaction.publicKey,
      },
      remainingAccounts: program.instruction.setOwners
        .accounts({
          multisig: multisig.publicKey,
          multisigSigner,
        })
        // Change the signer status on the vendor signer since it's signed by the program, not the client.
        .map((meta) =>
          meta.pubkey.equals(multisigSigner)
            ? { ...meta, isSigner: false }
            : meta
        )
        .concat({
          pubkey: program.programId,
          isWritable: false,
          isSigner: false,
        }),
    });

    multisigAccount = await program.account.multisig(multisig.publicKey);

    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, newOwners);
    assert.ok(multisigAccount.ownerSetSeqno === 1);
  });
});

```

### Example idl file `multisig.json`
```json
{
  "version": "0.0.0", // Placeholder
  "name": "multisig",
  "instructions": [
    {
      "name": "createMultisig",
      "accounts": [
        {
          "name": "multisig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "threshold",
          "type": "u64"
        },
        {
          "name": "nonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createTransaction",
      "accounts": [
        {
          "name": "multisig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pid",
          "type": "publicKey"
        },
        {
          "name": "accs",
          "type": {
            "vec": {
              "defined": "TransactionAccount"
            }
          }
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "approve",
      "accounts": [
        {
          "name": "multisig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "setOwners",
      "accounts": [
        {
          "name": "multisig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "multisigSigner",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "changeThreshold",
      "accounts": [
        {
          "name": "multisig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "multisigSigner",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "threshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeTransaction",
      "accounts": [
        {
          "name": "multisig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "multisigSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Multisig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owners",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "threshold",
            "type": "u64"
          },
          {
            "name": "nonce",
            "type": "u8"
          },
          {
            "name": "ownerSetSeqno",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "Transaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "multisig",
            "type": "publicKey"
          },
          {
            "name": "programId",
            "type": "publicKey"
          },
          {
            "name": "accounts",
            "type": {
              "vec": {
                "defined": "TransactionAccount"
              }
            }
          },
          {
            "name": "data",
            "type": "bytes"
          },
          {
            "name": "signers",
            "type": {
              "vec": "bool"
            }
          },
          {
            "name": "didExecute",
            "type": "bool"
          },
          {
            "name": "ownerSetSeqno",
            "type": "u32"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TransactionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "publicKey"
          },
          {
            "name": "isSigner",
            "type": "bool"
          },
          {
            "name": "isWritable",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "InvalidOwner",
      "msg": "The given owner is not part of this multisig."
    },
    {
      "code": 301,
      "name": "NotEnoughSigners",
      "msg": "Not enough owners signed this transaction."
    },
    {
      "code": 302,
      "name": "TransactionAlreadySigned",
      "msg": "Cannot delete a transaction that has been signed by an owner."
    },
    {
      "code": 303,
      "name": "Overflow",
      "msg": "Overflow when adding."
    },
    {
      "code": 304,
      "name": "UnableToDelete",
      "msg": "Cannot delete a transaction the owner did not create."
    },
    {
      "code": 305,
      "name": "AlreadyExecuted",
      "msg": "The given transaction has already been executed."
    },
    {
      "code": 306,
      "name": "InvalidThreshold",
      "msg": "Threshold must be less than or equal to the number of owners."
    }
  ]
}
```
