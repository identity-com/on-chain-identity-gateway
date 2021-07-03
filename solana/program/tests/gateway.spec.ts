import * as anchor from '@project-serum/anchor';
import * as fs from 'fs';
import * as assert from "assert";

type GatewayTokenState = { active: {} } | { frozen: {} } | { revoked: {} };
namespace GatewayTokenState{
    export const active: GatewayTokenState = { active: {} }
    export const frozen: GatewayTokenState = { frozen: {} }
    export const revoked: GatewayTokenState = { revoked: {} }
}

describe('gateway',  () => {
    const provider = anchor.Provider.local();
    anchor.setProvider(provider);

    // // Normal way
    // const idl = JSON.parse(fs.readFileSync('../target/idl/gateway.json', 'utf8'));
    // const program_id = new anchor.web3.PublicKey('9f61EdQ46ZriQXnoiDsth52LCyNW2Y7gaLa68SJJzvkt');
    // const program = new anchor.Program(idl, program_id);

    // Test only way
    const program = anchor.workspace.Gateway;

    it('addGatekeeper call test', async () => {
        const gatekeeperNetwork = anchor.web3.Keypair.generate();
        const gatekeeperAuthority = anchor.web3.Keypair.generate();
        const gatekeeperAccount = await program.account.gatekeeper.associatedAddress(
            gatekeeperAuthority.publicKey,
        );

        await program.rpc.addGatekeeper({
            accounts: {
                funderAccount: provider.wallet.publicKey,
                gatekeeperAccount: gatekeeperAccount,
                gatekeeperAuthority: gatekeeperAuthority.publicKey,
                gatekeeperNetwork: gatekeeperNetwork.publicKey,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [gatekeeperNetwork],   // Provider automatically signs
        });

        const gatekeeperAccountData = await program.account.gatekeeper.fetch(gatekeeperAccount);
        assert.deepStrictEqual(gatekeeperAccountData.gatekeeperAuthority, gatekeeperAuthority.publicKey);
        assert.deepStrictEqual(gatekeeperAccountData.gatekeeperNetwork, gatekeeperNetwork.publicKey);
    });

    it('issueVanilla call test', async () =>{
        const gatekeeperNetwork = anchor.web3.Keypair.generate();
        const gatekeeperAuthority = anchor.web3.Keypair.generate();
        const gatekeeperAccount = await program.account.gatekeeper.associatedAddress(
            gatekeeperAuthority.publicKey,
        );
        const owner = anchor.web3.Keypair.generate();
        const [gatewayToken, gatewayTokenNonce] = await anchor.web3.PublicKey.findProgramAddress(
            [owner.publicKey.toBuffer(), new Uint8Array()],
            program.programId
        );

        await program.rpc.issueVanilla(null, gatewayTokenNonce, null, {
            accounts: {
                funderAccount: provider.wallet.publicKey,
                gatewayToken: gatewayToken,
                owner: owner.publicKey,
                gatekeeperAccount: gatekeeperAccount,
                gatekeeperAuthority: gatekeeperAuthority.publicKey,
                gatekeeperNetwork: gatekeeperNetwork.publicKey,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [gatekeeperAuthority, gatekeeperNetwork],
            instructions: [
                program.instruction.addGatekeeper({
                    accounts: {
                        funderAccount: provider.wallet.publicKey,
                        gatekeeperAccount: gatekeeperAccount,
                        gatekeeperAuthority: gatekeeperAuthority.publicKey,
                        gatekeeperNetwork: gatekeeperNetwork.publicKey,
                        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                }),
            ],
        });

        const gatekeeperAccountData = await program.account.gatekeeper.fetch(gatekeeperAccount);
        assert.deepStrictEqual(gatekeeperAccountData.gatekeeperAuthority, gatekeeperAuthority.publicKey);
        assert.deepStrictEqual(gatekeeperAccountData.gatekeeperNetwork, gatekeeperNetwork.publicKey);

        const gatewayTokenData = await program.account.gatewayToken.fetch(gatewayToken);
        assert.deepStrictEqual(gatewayTokenData.nonce, gatewayTokenNonce);
        assert.deepStrictEqual(gatewayTokenData.seed, null);
        assert.deepStrictEqual(gatewayTokenData.features, 0);
        assert.deepStrictEqual(gatewayTokenData.parentToken, null);
        assert.deepStrictEqual(gatewayTokenData.ownerWallet, owner.publicKey);
        assert.deepStrictEqual(gatewayTokenData.ownerIdentity, null);
        assert.deepStrictEqual(gatewayTokenData.gatekeeperNetwork, gatekeeperNetwork.publicKey);
        assert.deepStrictEqual(gatewayTokenData.issuingGatekeeper, gatekeeperAuthority.publicKey);
        assert.deepStrictEqual(gatewayTokenData.state, GatewayTokenState.active);
        assert.deepStrictEqual(gatewayTokenData.expireTime, null);
    });
});
