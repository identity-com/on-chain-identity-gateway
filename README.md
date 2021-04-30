# on-chain-identity-client
This library provides a client and uility methods for helping Decentralized Apps (DAPPs) to make use of on-chain identity methods like gateway token retrieval, lookup, and revocation.

- [on-chain-identity-client](#on-chain-identity-client)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Import](#import)
  - [Functions/Classes](#functionsclasses)
    - [findGatewayTokens](#findgatewaytokens)
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
### findGatewayTokens
Utility method for finding gateway token created for a given public key. This method does the lookup against the Solana blockchain. Returns an empty array if gateway tokens doen't exist for the given public key.
```
const gatewayToken: PublicKey = await findGatewayToken(connection, owner, gatekeeperKey);
```
Optionally, a 'revoked' flag can be passed to allow retrieval of all, even revoked, tokens.

### GatekeeperClient
The GatekeeperClient is a class with helper methods to enable communication with a Gatekeeper server.

#### initialisation
The baseUrl of the gatekeeper server must be provided when creating a client instance. Additional headers can be passed in config
that will be added to HTTP requests to the gatekeeper-api:
```
const baseUrl: string = 'http://<gateway url>';
const clientInst = new GatekeeperClient({ baseUrl });
```

#### createGatewayToken
Requests that a gateway token be created for the given Solana public key. Returns the newly created gateway token as a string.
```
const gatewayToken = await gatekeeperClientInst.createGatewayToken(walletPublicKey);
```
An optional parameter 'selfDeclarationTextAgreedTo' can be provided indicating that the requester has read and agreed to the passed text.
```
const selfDeclarationTextAgreedTo = 'I declare I am not resident in <not-allowed-territory>'
...<UI for user to agree to text>
const gatewayToken = await gatekeeperClientInst.createGatewayToken({ walletPublicKey, selfDeclarationTextAgreedTo });
```
A gateway token can be requested by providing a Civic presentationRequestId. The gatekeeper server validates that the presentation provided by the user is successful and a token is generated. The presentationRequest created by the DAPP should contain the publicKey address to create the gateway token for.
```
const gatewayToken = await gatekeeperClientInst.createGatewayToken({ presentationRequestId });
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