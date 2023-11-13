# Deploy v0 contracts to a chain. See DEPLOY.md

# Usage: scripts/deployV0.sh <chain>
# Example: scripts/deployV0.sh sepolia

set -ue

# Get the chain name
CHAIN=$1

# Delete any existing build artifacts
rm -rf build
cp -r artifacts/v0 build

STAGE=prod yarn hardhat deploy --no-compile --tags GatewayTokenV0 --network $CHAIN