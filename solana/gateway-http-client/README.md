# Solana Gateway Http Client library

This library provides a client for allowing 
decentralized Apps (dApps) to make use of on-chain identity methods
like gateway token creation, lookup, and revocation.

- [Solana Gateway Http Client library](#solana-gateway-http-client-library)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Import](#import)
  - [Functions/Classes](#functionsclasses)
    - [GatekeeperClient](#gatekeeperclient)
      - [initialisation](#initialisation)
      - [requestGatewayToken](#requestgatewaytoken)
      - [auditGatewayToken](#auditgatewaytoken)
      - [requestAirdrop](#requestairdrop)

## Usage
### Installation
```
yarn add @identity.com/solana-gateway-http-client
```
### Import
```
import { GatekeeperClient, GatekeeperClientConfig, GatekeeperRecord } from '@identity.com/solana-gateway-http-client';
```

## Functions/Classes

### GatekeeperClient
The GatekeeperClient is a class with helper methods to enable communication with a Gatekeeper server.

#### initialisation
The baseUrl of the gatekeeper server must be provided when creating a client instance. Additional headers can be passed in config
that will be added to HTTP requests to the gatekeeper-api:
```
const baseUrl: string = 'http://<gateway url>';
const clientInst = new GatekeeperClient({ baseUrl });
```

#### requestGatewayToken
Requests that a gateway token be created for the given Solana public key. Returns the newly created gateway token as a string.
```
const gatewayToken = await gatekeeperClientInst.requestGatewayToken(walletPublicKey);

const gatewayToken = await gatekeeperClientInst.requestGatewayToken({ walletPublicKey });
```
A gateway token can be requested by providing a Civic presentationRequestId. The gatekeeper server validates that the presentation provided by the user is successful and a token is generated. The presentationRequest created by the DAPP should contain the publicKey address to create the gateway token for.
```
const gatewayToken = await gatekeeperClientInst.requestGatewayToken({ presentationRequestId });
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
