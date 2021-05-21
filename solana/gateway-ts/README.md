# Gateway-ts - library

This library provides a utility methods for helping 
decentralized Apps (dApps) to make use of on-chain identity methods
like gateway token retrieval, lookup, and revocation.

- [Gateway-ts - library](#gateway-ts---library)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Import](#import)
  - [Functions](#functions)
    - [findGatewayTokens](#findgatewaytokens)
    - [addGatekeeper](#addgatekeeper)
    - [getGatekeeperAccountKeyFromGatekeeperAuthority](#getgatekeeperaccountkeyfromgatekeeperauthority)
    - [getGatewayTokenKeyForOwner](#getgatewaytokenkeyforowner)
    - [issueVanilla](#issuevanilla)
    - [findGatewayTokens](#findgatewaytokens-1)

## Usage
### Installation
```
yarn add @identity.com/solana-gateway-ts
```
### Import
```
import {
  addGatekeeper,
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  getGatewayTokenKeyForOwner,
  issueVanilla,
  findGatewayTokens,
} from "@identity.com/solana-gateway-ts";
```

## Functions

### findGatewayTokens
Utility method for finding gateway token created for a given public key. This method does the lookup against the Solana blockchain. Returns an empty array if gateway tokens doesn't exist for the given public key.
```
const gatewayToken: PublicKey = await findGatewayToken(connection, owner, gatekeeperKey);
```
Optionally, a 'revoked' flag can be passed to allow retrieval of all, even revoked, tokens.

### addGatekeeper
Creates the instruction for adding a gatekeeper to the gatekeeper network
Usage:
```
const payer: Keypair;
const gatekeeperNetwork: Keypair;
const gatekeeperAccount: PublicKey;
const gatekeeperAuthority: PublicKey;
const transaction = new Transaction().add(
      addGatekeeper(
        payer.publicKey,
        gatekeeperAccount,
        gatekeeperAuthority,
        gatekeeperNetwork.publicKey
      )
    );

    await send(
      connection,
      transaction,
      payer,
      gatekeeperNetwork
    );
```

### getGatekeeperAccountKeyFromGatekeeperAuthority
Retrieves the gatekeeperAccount for a gatekeeper authority key, so the caller doens't need to keep a record of the gatekeeper account.
```
const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
```

### getGatewayTokenKeyForOwner
Derives a gateway token key for an owner using the gateway program, additionally accepting a seed parameter
```
const gatewayTokenKey = await getGatewayTokenKeyForOwner(owner);
```

### issueVanilla
Issue a vanilla gatewayToken for an account
```
const owner: PublicKey;
const payer: Keypair;
const gatekeeperNetwork: Keypair;
const gatekeeperAccount: PublicKey;
const gatekeeperAuthority: PublicKey;

const gatewayTokenKey = await getGatewayTokenKeyForOwner(owner);
const gatekeeperAccount =
  await getGatekeeperAccountKeyFromGatekeeperAuthority(
    gatekeeperAuthority.publicKey
  );

const transaction = new Transaction().add(
  issueVanilla(
    seed,
    gatewayTokenKey,
    payer.publicKey,
    gatekeeperAccount,
    owner,
    gatekeeperAuthority.publicKey,
    gatekeeperNetwork
  )
);

await send(
  connection,
  transaction,
  payer,
  gatekeeperAuthority
);
```

### findGatewayTokens
Find gatewayTokens that have been created on a network for an account
```
const owner: PublicKey;
const gatekeeperNetwork: Keypair;
const accounts = await findGatewayTokens(
    connection,
    owner.publicKey,
    gatekeeperNetworkKey
  );
```