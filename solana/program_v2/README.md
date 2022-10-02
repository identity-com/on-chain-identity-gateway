## Administrative Service

The administrative service allows one or more gaurdians to create and manage networks.

```typecript
// Construct the admin service
const adminService = AdminService.build(...); // TODO: IDCOM-2136

const networkPda = await AdminService.createNetworkAddress(
  gaurdianAuthority.publicKey, // the gaurdian authority used for managing networks
  networkIndex // A network index (defaults to 0, allows more than one network per authority)
);

// Create a network
await adminService.createNetwork(optionalParams).rpc(); // TODO: document init params

// Update a network
await adminService.updateNetwork(updateParams).rpc(); // TODO: document update params

// Close a network
await adminService.closeNetwork().rpc();

// Lookup network configuration
await adminService.

```

## Network Service

The network service provides functionality to manage gatekeepers within the network.

```typescript
// Construct the network service
const networkService = NetworkService.build(...); // TODO: IDCOM-2136

const networkPda = await NetworkService.createNetworkAddress(
    authority.publicKey, // the authority for the gatekeeper
    networkPda // The network to create the gatekeeper in
);

networkService.createGatekeeper();
networkService.updateGatekeeper();
networkService.closeGatekeeper();
networkService.setGatekeeperState();
networkService.gatekeeperWithdraw();
networkService.getGatekeeperAccount();

```

## Gatekeeper Interface

```typescript
const gatekeeperService = GatekeeperService.build(...); // TODO: IDCOM-2136

const passAddress = gatekeeperService.createPassAddress(network, subject, optionalIndex);

gatekeeperService.issuePass();
gatekeeperService.setPassState();
gatekeeperService.refreshPass();
gatekeeperService.expirePass();
gatekeeperService.changePassGatekeeper();

gatekeeperService.getPassAccount();

```

## Utility Methods
```typescript
findGatewayToken(gatekeeperPda, subject, optionalIndex);
```