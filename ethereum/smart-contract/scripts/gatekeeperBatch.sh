#!/bin/bash

# A batch script that automates adding or removing a gatekeeper to/from
# a number of gatekeeper networks
# on a number of chains.

# Check if the necessary arguments are provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <gatekeeper-address> <action>" >&2
  exit 1
fi

gatekeeper_address=$1  # Assign the first argument to gatekeeper_address
action=$2  # Assign the second argument to action

# Define the networks and gatekeepernetworks arrays
# mainnets
networks=(mainnet polygonMainnet arbitrumMainnet xdc polygonZkEVM fantom)
# testnets
#networks=(sepolia goerli polygonMumbai arbitrumGoerli xdcApothem polygonZkEVMTestnet fantomTestnet)
gatekeepernetworks=(1 12 13 14 15 16 17 18 20 21 23 25)

# Load completed tasks from batch.temp
completed_tasks=()
if [[ -f batch.temp ]]; then
  while IFS= read -r line; do
    completed_tasks+=("$line")
  done < batch.temp
fi

# Iterate through each network
for N in "${networks[@]}"
do
  # Iterate through each gatekeeper network
  for G in "${gatekeepernetworks[@]}"
  do
    # Check if this task was already completed
    if [[ " ${completed_tasks[*]} " == *"$N $G $action"* ]]; then
      echo "♻️ $N $G $action"
      continue  # Skip to the next iteration
    fi

    # Execute the hardhat task and capture the output
    output=$(yarn hardhat --network "$N" "$action"-gatekeeper --gatekeeper "$gatekeeper_address" --gatekeepernetwork "$G" 2>&1)

    # Check if the task was successful
    if [[ $output == *"Done"* ]]; then
      time=${output##* }
      echo "✅ $N $G $action $time"
      # Save this completed task to batch.temp
      echo "$N $G $action" >> batch.temp
    else
      # Log the error message to stderr
      echo "❌ $N $G $action" >&2
      echo "$output" >&2
    fi
  done
done
