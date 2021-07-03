const GatewayTokenController = artifacts.require('GatewayTokenController');
const GatewayToken = artifacts.require('GatewayToken');
const {web3} = require("@openzeppelin/test-environment");
const { emitted, reverted, equal, notEqual, } = require('./utils').assert;
const { ONE_MINUTE, ONE_DAY, ONE_YEAR, advanceTimeAndBlock, takeSnapshot, revertToSnapshot, getLatestTimestamp, } = require('./utils').time;
const { should } = require('chai');
should();

const expectRevert = reverted;

const expectEvent = async (res, eventName, msg) => {
    if (!msg) return await emitted(res, eventName);
    emitted(res, eventName, (ev) => {
      Object.keys(msg).forEach((key) => {
        equal(msg[key], String(ev[key]));
      });
      return true;
    });
};

contract('GatewayTokenController', async (accounts) => {
    const [owner, alice, bob, carol] = accounts;
    let civic = owner;

    let tokenController;
    let gatewayTokens = [];

    before('deploy contracts', async () => {
        tokenController = await GatewayTokenController.new({from: civic});
    });

    describe('Test executing functions only for Civic admin by third-party address', async () => {
        it('Try to change token controller admin by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                tokenController.transferAdmin(bob, {from: bob}), "NOT CIVIC_ADMIN"
            );
        });

        it('Try to deploy new gateway token contract by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                tokenController.deployGatewayToken("CVC-Test-KYC", "cKYC", {from: bob}), "NOT CIVIC_ADMIN"
            );
        });
    });

    describe('Test GatewayToken deployment functions', async () => {
        it('Deploy test GatewayToken contract with cKYC symbol', async () => {
            let gatewayToken = await tokenController.deployGatewayToken("CVC-Test-KYC", "cKYC", {from: civic});
            await emitted(gatewayToken, 'GatewayTokenCreated');

            gatewayTokens.push(gatewayToken.logs[0].args.tokenAddress);
        });

        it('Try to mint GatewayToken by Bob, expect revert', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            await expectRevert(
                gatewayToken.mint(bob, 1, {from: bob}), "MUST BE GATEKEEPER"
            );
        });

        it('Successfully add alice as gatekeeper to gateway token contract', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.addGatekeeper(alice, {from: civic});
            await emitted(tx, "RoleGranted");
        });

        it('Expect revert on adding new gatekeeper by Bob', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            await expectRevert(
                gatewayToken.addGatekeeper(bob, {from: bob}), ""
            );
        });

        it('Successfully mint Gateway Token for Bob by Alice', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.mint(bob, 1, {from: alice});
            await emitted(tx, "Transfer");

            let tokenOwner = await gatewayToken.ownerOf(1, {from: alice});
            await equal(tokenOwner, bob);

            let bobBalance = await gatewayToken.balanceOf(bob, {from: alice});
            await equal(bobBalance.toString(), '1');
        });

        it('Expect revert on adding Carol as a gatekeeper and removing gateway token deployer by Alice', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            await expectRevert(
                gatewayToken.addGatekeeper(carol, {from: alice}), ""
            );

            await expectRevert(
                gatewayToken.removeGatekeeper(civic, {from: alice}), ""
            );
        });

        it("Successfully burn Bob's Gateway Token by Alice", async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.burn(1, {from: alice});
            await emitted(tx, "Transfer");

            // verify Bob's balance after burning his gateway token
            let bobBalance = await gatewayToken.balanceOf(bob, {from: alice});
            await equal(bobBalance.toString(), '0');
        });
    });

    describe('Test adding network authorities via Gateway Token Controller', async () => {
        it('Succesfully add 3 new network authorities to existing cKYC gateway token', async () => {
            let authorities = [alice, bob, carol];
            let tx = await tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: civic});
        });

        it('Succesfully add 1 new network authority to existing cKYC gateway token', async () => {
            let authorities = ["0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1"];
            let tx = await tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: civic});
        });

        it('Successfully add Bob as a gatekeeper by Alice after becoming network authority', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.addGatekeeper(bob, {from: alice});
            await emitted(tx, "RoleGranted");
        });

        it("Try to remove non-existing network authorities from cKYC gateway token, don't expect revert", async () => {
            let authorities = ['0x2F60d06Fa6795365B7b42B27Fa23e3e8c8b82f66'];
            let tx = await tokenController.removeNetworkAuthorities(gatewayTokens[0], authorities, {from: civic});
        });

        it("Remove 1 network authority from cKYC gateway token", async () => {
            let authorities = ['0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1'];
            let tx = await tokenController.removeNetworkAuthorities(gatewayTokens[0], authorities, {from: civic});
        });

        it('Expect revert on adding new network authority by Alice', async () => {
            let authorities = ["0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1"];
            await expectRevert(
                tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: alice}), "NOT CIVIC_ADMIN"
            );
        });

        it('Expect revert on removing existing network authorities by Alice', async () => {
            let authorities = [alice, bob, carol];
            await expectRevert(
                tokenController.removeNetworkAuthorities(gatewayTokens[0], authorities, {from: alice}), "NOT CIVIC_ADMIN"
            );
        });
    });

    describe('Test gateway token transfers with restricted and accepted transfers for token owners', async () => {
        it('Successfully mint Gateway Token for Alice by Civic with tokenID = 1', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.mint(alice, 1, {from: civic});
            await emitted(tx, "Transfer");

            let tokenOwner = await gatewayToken.ownerOf(1, {from: alice});
            await equal(tokenOwner, alice);

            let aliceBalance = await gatewayToken.balanceOf(alice, {from: alice});
            await equal(aliceBalance.toString(), '1');
        });

        it('Successfully mint Gateway Token for Bob by Alice with tokenID = 2', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.mint(bob, 2, {from: alice});
            await emitted(tx, "Transfer");
        });

        it("Successfully transfer Alice's gateway token to Carol account because Bob is a gatekeeper", async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.safeTransferFrom(alice, carol, 1, {from: bob});
            await emitted(tx, "Transfer");
        });

        it("Remove Bob from gatekeepers list, try to transfer 1st tokenId on behalf of Carol, expect revert", async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);
            let removal = await gatewayToken.removeGatekeeper(bob, {from: alice});
            await emitted(removal, "RoleRevoked");

            await expectRevert(
                gatewayToken.safeTransferFrom(carol, bob, 1, {from: bob}), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );
        });

        it("Try to transfer 1st tokenId by Carol while transfers still restricted", async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            await expectRevert(
                gatewayToken.transferFrom(carol, alice, 1, {from: carol}), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );
        });

        it("Allow cKYC token transfers, try to perform the same transfer again successfully now", async () => {
            let tx = await tokenController.acceptTransfersBatch([gatewayTokens[0]], {from: civic});
            await emitted(tx, "TransfersAcceptedBatch");

            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);
            tx = await gatewayToken.transferFrom(carol, alice, 1, {from: carol});
            await emitted(tx, "Transfer");
        });

        it("Freeze Bob's Gateway Token by Alice. expect revert on setting identity", async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.freeze(2, {from: alice});
            await emitted(tx, "Freeze");

            await expectRevert(
                gatewayToken.setTokenURI(2, "0xSimpleIdenitity", {from: alice}), "TOKEN DOESN'T EXIST OR FREEZED"
            );
        });

        it("Unfreeze Bob's Gateway Token by Alice. set identity, restrict transfers by Carol and don't expect revert on Bob's transfer to Alice because Bob is a Gatekeeper", async () => {
            const identityURI = "0xSimpleIdenitity";
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            await expectRevert(
                gatewayToken.unfreeze(2, {from: bob}), "MUST BE GATEKEEPER"
            );

            let tx = await gatewayToken.unfreeze(2, {from: alice});
            await emitted(tx, "Unfreeze");

            tx = await gatewayToken.setTokenURI(2, identityURI, {from: alice});

            let identity = await gatewayToken.getIdentity(2);
            await equal(identity, identityURI);

            tx = await tokenController.restrictTransfersBatch([gatewayTokens[0]], {from: civic});
            await emitted(tx, "TransfersRestrictedBatch");

            await expectRevert(
                gatewayToken.transferFrom(bob, alice, 2, {from: bob}), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );

            tx = await gatewayToken.transferFrom(bob, alice, 2, {from: alice});
            await emitted(tx, "Transfer");
        });
    });

    describe('Test gateway token verification with freezed, active, expired tokens and blacklisted users', async () => {
        it('Verify existing tokens held by Alice with tokenId 1 and 2', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let validity = await gatewayToken.verifyToken(1, alice, {from: carol});
            await equal(validity, true);

            validity = await gatewayToken.verifyToken(2, alice, {from: bob});
            await equal(validity, true);
        });

        it('Freeze 1st token and set expiration for second token', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.freeze(1, {from: alice});
            await emitted(tx, "Freeze");

            validity = await gatewayToken.verifyToken(1, alice, {from: bob});
            await equal(validity, false);

            tx = await gatewayToken.setExpiration(2, 12, {from: alice});
            await emitted(tx, "Expiration");

            validity = await gatewayToken.verifyToken(1, alice, {from: bob});
            await equal(validity, false);
        });

        it('Mint token for Carol, verify first time and blacklist Carol globally', async () => {
            const carolIdentity = "0xSimpleIdenitity";

            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            let tx = await gatewayToken.mint(carol, 3, {from: alice});
            await emitted(tx, 'Transfer');

            let tokenOwner = await gatewayToken.ownerOf(3, {from: carol});
            await equal(tokenOwner, carol);

            let carolBalance = await gatewayToken.balanceOf(carol, {from: carol});
            await equal(carolBalance.toString(), '1');

            tx = await gatewayToken.setTokenURI(3, carolIdentity, {from: alice});
            let identity = await gatewayToken.getIdentity(3);
            await equal(identity, carolIdentity);

            let validity = await gatewayToken.verifyToken(3, carol, {from: carol});
            await equal(validity, true);

            // Blacklisting Carol
            tx = await tokenController.blacklist(carol, {from: civic});
            await emitted(tx, "Blacklisted");

            validity = await gatewayToken.verifyToken(3, carol, {from: carol});
            await equal(validity, false);
        });

        it('Expect revert on minting additional tokens for Carol, freezing and setting expiration. Finally burn token', async () => {
            let gatewayToken = await GatewayToken.at(gatewayTokens[0]);

            await expectRevert(
                gatewayToken.mint(carol, 4, {from: alice}), "BLACKLISTED USER"
            );

            await expectRevert(
                gatewayToken.freeze(3, {from: alice}), "BLACKLISTED USER"
            );

            await expectRevert(
                gatewayToken.setExpiration(3, 1000, {from: alice}), "BLACKLISTED USER"
            );

            // Burn Carol's token
            tx = await gatewayToken.burn(3, {from: civic});
            await emitted(tx, "Transfer");
        });
    });
});
