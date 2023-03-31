#!/bin/sh
# Change to the correct directory
cd /usr/src/app;
# Run hardhat
(sleep 10 && echo "Deploying..." && yarn deploy localhost) &
echo "Starting hardhat..."
yarn local --no-deploy
