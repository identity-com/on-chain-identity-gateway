TODO add https://github.com/project-serum/anchor/tree/master/tests/pyth/programs/pyth/src as a submodule
so that we can test Pyth integration on localnet

# Pseudo-test code

const program = workspace.Pyth as Program<Pyth>;

// create the account (SystemProgram.createAccount())
const price = ..

await program.rpc.initialize(priceVal, expo, conf, {
    accounts: {
        price
    }
})

// price account that has priceVal inside

