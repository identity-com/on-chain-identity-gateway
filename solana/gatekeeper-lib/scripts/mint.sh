export SRM=9uqXF7SY4UMbafGgYdSP8C3aMs7yVfMS5hLazSL3HHqv
export USDC=A8ATx6jbURxARksQ4oJMfeGX8Y2PEcQQi2EW7iRBies9
spl-token -C scripts/mintAuth.yml mint $USDC 10000000
spl-token -C scripts/mintAuth.yml  mint $SRM 10000000
solana -C scripts/mintAuth.yml  airdrop 10
solana -C scripts/mintAuth.yml  transfer $1 10 --allow-unfunded-recipient
spl-token -C scripts/mintAuth.yml transfer --fund-recipient $USDC 10000000 $1
spl-token -C scripts/mintAuth.yml transfer --fund-recipient $SRM 10000000 $1
