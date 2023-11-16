# Deploy contracts to a chain, retaining the original Create2 addresses used on other chains

# Usage: scripts/deployFull.sh <chain>
# Example: scripts/deployFull.sh sepolia

set -ue

# Get the chain name
CHAIN=$1

# STAGE 1: Deploy the original contracts and create the networks

# Delete any existing build artifacts
rm -rf build
mkdir build
cp -r artifacts/v0/* build/

# Deploy the original contracts
STAGE=prod yarn hardhat deploy --no-compile --tags GatewayTokenV0 --network $CHAIN
# Add the default gatekeeper networks (and add the gatekeepers to them)
STAGE=prod IGNORE_DEPS=1 yarn hardhat deploy --no-compile --tags BaseGatekeeperNetworks --network $CHAIN

echo "STAGE 1 complete. Press enter to continue."
read -p ""

# STAGE 2: Deploy the forwarder

# Deploy the latest forwarder (v1 - just to match the deployed address on other chains)
cp -r artifacts/v1/* build/
STAGE=prod yarn hardhat deploy --no-compile --tags Forwarder --network $CHAIN

echo "STAGE 2 complete. Press enter to continue."
read -p ""

# STAGE 3: Rebuild and upgrade the contracts

yarn clean
yarn build
# Import the contracts to using hardhat-upgrades (this does not happen by default)
STAGE=prod IGNORE_DEPS=1 yarn hardhat deploy --no-compile --tags UpgradeImport --network $CHAIN
yarn upgrade-contracts $CHAIN

echo "STAGE 3 complete. Script finished."
