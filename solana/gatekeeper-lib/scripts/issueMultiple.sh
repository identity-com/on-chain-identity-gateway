#
# Bulk-issue gateway tokens to a new gatekeeper network
#
# Usage:
#
#   CLUSTER=devnet ./issueMultiple.sh addresses.txt
#
# Notes before running:
# 1. Ensure your addresses file ends with a newline (or the last entry will be skipped)
# 2. The script uses the keypair in ${HOME}/.config/solana/id.json as the gatekeeper.
# 3. Ensure your gatekeeper balance has sufficient SOL. Each token costs 0.0016 SOL to issue, plus 0.001 SOL
# to establish the gk network. On devnet, the script executes airdrops, on mainnet this is skipped
# 4. To run on mainnet, use CLUSTER=mainnet-beta
# 5. The script waits for each token before proceeding, which is safer, but slow. To speed it up,
# at the risk of making it harder to recover from issues, add " &" to the end of line 36 "gateway issue..."

set -e
set -u

export SOLANA_CLUSTER=${CLUSTER:-devnet}

FILE=$1

echo "Creating a new gatekeeper network..."
solana-keygen new -s --no-bip39-passphrase -o gkn.json
echo "Created gatekeeper network $(solana address -k gkn.json)"

echo "Funding gatekeeper network..."
solana transfer -u ${SOLANA_CLUSTER} $(solana address -k gkn.json) 0.001 --allow-unfunded-recipient

echo "Adding current solana address $(solana address) to gatekeeper network" 
gateway add-gatekeeper -n gkn.json $(solana address)

while IFS= read -r line
do
  gateway issue ${line} -g ${HOME}/.config/solana/id.json -n $(solana address -k gkn.json)
done < "$FILE"

echo "Done adding gateway tokens to gatekeeper network $(solana address -k gkn.json)"