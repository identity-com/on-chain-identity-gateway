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

creates a new network account

```ts
  await adminService.createNetwork(data: CreateNetworkData, authority?: PublicKey).rpc();
```

In order to use createNetwork instruction, you need to pass in the parameter, CreateNetworkData. 

```ts
  export type CreateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
  supportedTokens: SupportedToken[];
};
```
authThreshold - the number of keys needed to change the `auth_keys`.

passExpireTime - the length of time a pass lasts in seconds. `0` means does not expire.

fees - The fees for this network, it's type feeStructure is defined below.
```ts
export type FeeStructure = {
  token: PublicKey;
  issue: number;
  refresh: number;
  expire: number;
  verify: number;
};
```

authkeys - Keys with permissions on the network, it's type AuthKeyStructure is defined below.

```ts
export type AuthKeyStructure = {
  flags: number;
  key: PublicKey;
};
```

supportedTokens - A set of all supported tokens on the network, it's type supportedToken is defined below.

```ts
export type SupportedToken = {
  key: PublicKey;
  settlementInfo: SettlementInfo;
};
```

### Update a Network Account

updates an existing network account with new data (e.g. new guardian authority)

```ts
    await adminService.updateNetwork(data: UpdateNetworkData, authority?: PublicKey).rpc();
```
In order to use updateNetwork instruction, you need to pass in the parameter, UpdateNetworkData. 

```ts
export type UpdateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: UpdateFeeStructure;
  authKeys: UpdateAuthKeytructure;
  networkFeatures: number;
  supportedTokens: UpdateSupportedTokens;
};
```
authThreshold - the number of keys needed to change the `auth_keys`.

passExpireTime - the length of time a pass lasts in seconds. `0` means does not expire.

fees - The fees for this network, it's type feeStructure is defined below.

authkeys - Keys with permissions on the network, it's type AuthKeyStructure is defined below.

```ts
export type AuthKeyStructure = {
  flags: number;
  key: PublicKey;
};
```
networkFeatures - Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.

supportedTokens - A set of all supported tokens on the network, it's type UpdateSupportedToken is defined below.

```ts
export type UpdateSupportedTokens = {
  add: SupportedToken[];
  remove: PublicKey[];
};
```

```ts
 
### Close a Network Account

Close a network account. This will also close all gatekeepers associated with the network.

```ts
    await adminService.closeNetwork(destination: PublicKey, authority?: PublicKey).rpc();
```

### Retrieve a Network Account

Retrieves a network account information 

```ts
    await adminService.getNetworkAccount(account: PublicKey).rpc();
```

## Usage - `gatekeeper` Manipulation

The following are instructions that can be executed against a gatekeeper.

When manipulating a DID one generally needs two authoritative elements:

1. An `authority`, a (native) Verification Method with a `Capability Invocation` flag, that is allowed to manipulate the network.
2. A `fee payer`, a Solana account that covers the cost of the transaction execution.

### Create a Gatekeeper Account

creates a new gatekeeper account 

```ts
  await networkService.createGatekeeper(
    network: PublicKey, 
    stakingAccount: PublicKey, 
    payer: PublicKey, 
    data: CreateGatekeeperData
    ).rpc();
```

### Update a Gatekeeper Account

updates an existing gatekeeper account 

```ts
    await networkService.updateGatekeeper(
        data: UpdateGatekeeperData,
        stakingAccount: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc()
```

### Set a Gatekeeper Account's State

sets the state of an existing gatekeeper account 0,1,2 = active, frozen, halted

```ts
    await networkService.setGatekeeperState(
        state: GatekeeperState,
        stakingAccount: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc()
```

```ts
    await networkService.setGatekeeperState(
        state: GatekeeperState,
        authority?: PublicKey
    ).rpc()
```

### Close a Gatekeeper Account

Close a gatekeeper account. This will also close all passes associated with the gatekeeper.

```ts
    await networkService.closeNetwork(
        network: PublicKey,
        destination?: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
        ).rpc();
```

### Retrieve a Gatekeeper Account

Retrieves a gatekeeper account information

```ts
    await networkService.getGatekeeperAccount(account: PublicKey).rpc();
```

// TODO: Add information and implementation for all instructions.

## Usage - `pass` Manipulation

### Issue a Pass Account

issues a new pass account

```ts
    await gatekeeperService.issuePass(
        data: IssuePassData,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
```

### Refresh a Pass Account

refreshes an existing pass account

```ts
    await gatekeeperService.refreshPass(
        data: RefreshPassData,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
```

### Set State for a Pass Account

sets the state of an existing pass account 0,1,2 = active, frozen, halted

```ts
    await gatekeeperService.setPassState(
        state: PassState,
        pass: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
```

### Set Data for a Pass Account

sets the data of an existing pass account

```ts
    await gatekeeperService.setPassData(
        data: SetPassDataData,
        pass: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
``` 

### Change the Associated Gatekeeper for a Pass Account

changes the associated gatekeeper of an existing pass account

```ts
    await gatekeeperService.changePassGatekeeper(
        gatekeeper: PublicKey,
        pass: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
```

### Expire a Pass Account

expires an existing pass account

```ts
    await gatekeeperService.expirePass(
        pass: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
```

### Verify a Pass Account

verifies an existing pass account

```ts
    await gatekeeperService.verifyPass(
        pass: PublicKey,
        payer?: PublicKey,
        authority?: PublicKey
    ).rpc();
```

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
