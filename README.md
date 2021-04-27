# on-chain-identity-client
This library provides a client and uility methods for helping Decentralized Apps (DAPPs) to make use of on-chain identity methods like gateway token retrieval, lookup, and revocation.

- [on-chain-identity-client](#on-chain-identity-client)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Import](#import)
  - [Functions/Classes](#functionsclasses)
    - [findGatewayToken](#findgatewaytoken)
    - [GatekeeperClient](#gatekeeperclient)
      - [initialisation](#initialisation)
      - [createGatewayToken](#creategatewaytoken)
      - [auditGatewayToken](#auditgatewaytoken)
      - [requestAirdrop](#requestairdrop)

## Usage
### Installation
```
yarn add @identity.com/on-chain-identity-client
```
### Import
```
import { GatekeeperClient, GatekeeperClientConfig, GatekeeperRecord, findGatewayToken } from 'on-chain-identity-client';
```

## Functions/Classes
### findGatewayToken
Utility method for finding a gateway token for a given public key. This method does the lookup against the Solana blockchain. Returns null if a gateway token doesn't exist for the given public key.
```
const gatewayToken: PublicKey = await findGatewayToken(connection, owner, mintAuthorityPublicKey);
```

### GatekeeperClient
The GatekeeperClient is a class with helper methods to enable communication with a Gatekeeper server.

#### initialisation
The baseUrl of the gatekeeper server must be provided when creating a client instance:
```
const baseUrl: string = 'http://<gateway url>';
const clientInst = new GatekeeperClient({ baseUrl });
```

#### createGatewayToken
Requests that a gateway token be created for the given Solana public key. Returns the newly created gateway token as a string.
```
const gatewayToken = await gatekeeperClientInst.createGatewayToken(walletPublicKey);
```

#### auditGatewayToken
Requests a GatekeeperRecord for the given gateway token. The requester must have sufficient privileges to access the GatekeeperRecord.
```
const auditGatewayTokenResponse: GatekeeperRecord = await gatekeeperClientInst.auditGatewayToken(token);
```

#### requestAirdrop
Requests an airdrop of test tokens for predefined test market token accounts (defined in the gatekeeper server). Only available in test environments.
```
await gatekeeperClientInst.requestAirdrop(walletPublicKey);
```