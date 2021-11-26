# Uses the spl-token API to create a new token and token account, and mint coins.
# Use this to test the usage CLI locally

set -e
set -u

TOKEN=$(spl-token create-token | head -n 1 | awk '{print $3}')
spl-token create-account $TOKEN
spl-token mint $TOKEN 1000000000
