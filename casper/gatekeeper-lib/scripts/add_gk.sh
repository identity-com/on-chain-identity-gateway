# Usage
#  get_contract_hash.sh <chain> <deploy_hash> <token_name>
#
# where chain is:
# integration-test, casper-test, mainnet
#
# and token_name is e.g. CivicNileToken or CivicGenesisToken
#
CHAIN=$1
DEPLOY_HASH=$2
TOKEN_NAME=$3

if [[ $CHAIN == "casper-test" ]]; then
  echo "Checking casper-test"
  NODE="http://138.201.54.44:7777/rpc"
elif [[ $CHAIN == "mainnet" ]]; then
  echo "Checking mainnet"
  NODE="http://3.14.161.135:7777/rpc"
else
  echo "Checking integration-test"
  NODE="http://3.140.179.157:7777/rpc"
fi

bin/run add-gatekeeper 01ceec5e0aa35ddfaa7f550717370c80f2be29c6181795d22e2bb58f300556f873