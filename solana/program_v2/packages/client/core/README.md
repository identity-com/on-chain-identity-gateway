# `Solana Gateway` Client

A typescript client library for interacting with Identity.com's On-Chain Identity Gateway

## Features

The `gateway-solana-client` library provides the following features:

1. A W3C [DID core spec (v1.0)](https://www.w3.org/TR/did-core/) compliant DID method and resolver operating on the Solana Blockchain.
2. TS Client and CLI for creating, manipulating, and resolving `did:sol`.
3. Generic Support for VerificationMethods of any Type and Key length.
4. Native on-chain support for `Ed25519VerificationKey2018`, `EcdsaSecp256k1RecoveryMethod2020` and `EcdsaSecp256k1VerificationKey2019`. This means DID state changes can be performed by only providing a valid secp256k1 signature to the program (it still requires a permissionless proxy).
5. On-Chain nonce protection for replay protection.
6. Dynamic (perfect) Solana account resizing for any DID manipulation.
7. Permissionless instruction to migrate any `did:sol` state to the new authoritative program.
8. A web-service driver, compatible with [uniresolver.io](https://unresolver.io) and [uniregistrar.io](https://uniregistrar.io).
9. A [did-io](https://github.com/digitalbazaar/did-io) compatible driver.
10. Based on the versatile [Anchor framework](https://github.com/coral-xyz/anchor).
11. Improved data model (`enum` for types and `bit-flags` for certain properties).
12. Introduced `OWNERSHIP_PROOF` to indicate that a Verification Method Key signature was verified on-chain.
13. Introduced `DID_DOC_HIDDEN` flag that enables hiding a Verification Method from the DID resolution.
14. Account Size can grow beyond transaction size limits (an improvement from the legacy program).

## Client library

### Installation

In TS/JS project:

```shell
yarn add @identity.com/gateway-solana-client # or npm install @identity.com/gateway-solana-client
```

### Usage - Setup and Resolution

#### AdminService

The AdminService class controls all network operations within the client. It can be built with or without Anchor, though the build methods differ slightly.

```ts
    const program = anchor.workspace.SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
    const programProvider = program.provider as anchor.AnchorProvider;
    const authorityKeypair = Keypair.generate();
    const guardianAuthority = new anchor.Wallet(authorityKeypair);
    const networkAuthority = Keypair.generate();

    // with anchor 
    const service = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: guardianAuthority,
      },
      programProvider
    );
    
    // without anchor
    const service = await AdminService.build(
        network: PublicKey,
        options: GatewayServiceOptions = {
            clusterType: SOLANA_MAINNET,
        }
    )
```

#### NetworkService

The NetworkService class controls all gatekeeper operations within the client. It can be built with or without Anchor, though the build methods differ slightly. Must be built with an existing network already in place.

```ts
    const program = anchor.workspace.SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
    const programProvider = program.provider as anchor.AnchorProvider;
    const guardianAuthority = Keypair.generate();
    const networkAuthority = Keypair.generate();
    const gatekeeperAuthority = Keypair.generate();

    // PDA for a gatekeeper — derived from network's account and a provided authority
    [gatekeeperDataAccount] = await NetworkService.createGatekeeperAddress(
      gatekeeperAuthority.publicKey,
      networkAuthority.publicKey
    );

    // with anchor 
    const networkService = await NetworkService.buildFromAnchor(
      program,
      gatekeeperAuthority.publicKey,
      gatekeeperDataAccount,
      {
        clusterType: 'devnet',
        wallet: new anchor.Wallet(gatekeeperAuthority),
      },
      programProvider
    );

    // without anchor
    const service = await AdminService.build(
        gatekeeperAuthority.publicKey,
        gatekeeperDataAccount,
        options: GatewayServiceOptions = {
            clusterType: SOLANA_MAINNET,
        }
    )
```

#### GatekeeperService

The GatekeeperService class controls all pass operations within the client. It can be built with or without Anchor, though the build methods differ slightly. Must be built with both an existing network and gatekeeper in place.

```ts
    const program = anchor.workspace.SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
    const programProvider = program.provider as anchor.AnchorProvider;
    const guardianAuthority = Keypair.generate();
    const networkAuthority = Keypair.generate();
    const gatekeeperAuthority = Keypair.generate();

    // Built AdminService
    const adminService: AdminService;
    // Built NetworkService
    const networkService: NetworkService;
    // pre-existing network
    const networkPDA: PublicKey;
    // pre-existing gatekeeper
    const gatekeeperPDA: PublicKey

    // with anchor
    const gatekeeperService = await GatekeeperService.buildFromAnchor(
        program,
        networkPDA,
        gatekeeperPDA,
        options: GatewayServiceOptions = {
            clusterType: 'devnet',
        },
        programProvider
    );

    // without anchor
    const gatekeeperService = await GatekeeperService.build(
        networkPDA,
        gatekeeperPDA,
        options: GatewayServiceOptions = {
            clusterType: SOLANA_MAINNET,
        }
    );
```

## Usage - `network` Manipulation

The following are instructions that can be executed against a network.

When manipulating a network one generally needs two authoritative elements:

1. An `authority`, a (native) Verification Method with a `Capability Invocation` flag, that is allowed to manipulate the network.
2. A `fee payer`, a Solana account that covers the cost of the transaction execution.

### Create a Network Account

// TODO: Add description

```ts
  await adminService.createNetwork(data: CreateNetworkData, authority?: PublicKey).rpc();
```

### Update a Network Account

// TODO: Add description

```ts
    await adminService.updateNetwork(data: UpdateNetworkData, authority?: PublicKey).rpc();
```

### Close a Network Account

// TODO: Add description

```ts
    await adminService.closeNetwork(destination: PublicKey, authority?: PublicKey).rpc();
```

### Retrieve a Network Account

// TODO: Add description

```ts
    await adminService.getNetworkAccount(account: PublicKey).rpc();
```

## Usage - `gatekeeper` Manipulation

The following are instructions that can be executed against a gatekeeper.

When manipulating a DID one generally needs two authoritative elements:

1. An `authority`, a (native) Verification Method with a `Capability Invocation` flag, that is allowed to manipulate the network.
2. A `fee payer`, a Solana account that covers the cost of the transaction execution.

### Create a Gatekeeper Account

// TODO: Add description

```ts
  await networkService.createGatekeeper(
    network: PublicKey, 
    stakingAccount: PublicKey, 
    payer: PublicKey, 
    data: CreateGatekeeperData
    ).rpc();
```

### Update a Gatekeeper Account

// TODO: Add description

```ts
    await networkService.updateGatekeeper(
        data: UpdateGatekeeperData,
        stakingAccount: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc()
```

### Set a Gatekeeper Account's State

// TODO: Add description

```ts
    await networkService.setGatekeeperState(
        state: GatekeeperState,
        authority?: PublicKey
    ).rpc()
```

### Close a Gatekeeper Account

// TODO: Add description

```ts
    await networkService.closeNetwork(
        network: PublicKey,
        destination?: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
        ).rpc();
```

### Retrieve a Gatekeeper Account

// TODO: Add description

```ts
    await networkService.getGatekeeperAccount(account: PublicKey).rpc();
```

// TODO: Add information and implementation for all instructions.

## Usage - `pass` Manipulation

### Issue a Pass Account

### Refresh a Pass Account

### Set State for a Pass Account

### Set Data for a Pass Account

### Change the Associated Gatekeeper for a Pass Account

### Expire a Pass Account

### Verify a Pass Account

## Contributing

Note: Before contributing to this project, please check out the code of conduct and contributing guidelines.

Gateway uses [yarn](https://yarnpkg.com/)

```shell
yarn
```

## Running the tests

### E2E tests

Install Solana locally by following the steps described [here](https://docs.solana.com/cli/install-solana-cli-tools).
Also, install Anchor by using the information found [here](https://book.anchor-lang.com/getting_started/installation.html)

```shell
yarn test
```
