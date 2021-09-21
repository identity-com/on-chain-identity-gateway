const GatewayTokenController = artifacts.require('GatewayTokenController');
const GatewayToken = artifacts.require('GatewayToken');
const FlagsStorage = artifacts.require('FlagsStorage');
const Forwarder = artifacts.require('Forwarder');

const {web3} = require("@openzeppelin/test-environment");
const { emitted, reverted, equal, notEqual, } = require('./utils').assert;
const {toBytes32} = require('./utils').strings;
const { ONE_MINUTE, ONE_DAY, ONE_YEAR, advanceTimeAndBlock, takeSnapshot, revertToSnapshot, getLatestTimestamp, getTimestampPlusDays } = require('./utils').time;
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
    let identityCom = owner;

    let forwarder;
    let tokenController;
    let flagsStorage;
    let gatewayTokens = [];
    let gatewayToken;

    let hexRetailFlag = toBytes32("Retail");
    let hexInstitutionFlag = toBytes32("Institution");
    let hexAccreditedInvestorFlag = toBytes32("AccreditedInvestor");
    let hexUnsupportedFlag = toBytes32("hexUnsupportedFlag");
    let hexUnsupportedFlag2 = toBytes32("hexUnsupportedFlag2");

    before('deploy contracts', async () => {
        forwarder = await Forwarder.new({from: identityCom});
        flagsStorage = await FlagsStorage.new(identityCom, {from: identityCom});
        tokenController = await GatewayTokenController.new(flagsStorage.address, {from: identityCom});
    });

    describe('Test executing functions only for Identity.com admin by third-party address', async () => {
        it('Try to change token controller admin by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                tokenController.transferAdmin(bob, {from: bob}), "NOT IDENTITY_COM_ADMIN"
            );
        });
    });

    describe('Test FlagsStorage smart contract', async () => {
        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                tokenController.transferAdmin(bob, {from: bob}), "NOT IDENTITY_COM_ADMIN"
            );
        });

        it('Successfully add flag by daoController, expect success', async () => {
            let tx = await flagsStorage.addFlag(hexRetailFlag, 0, {from: identityCom});
            await emitted(tx, "FlagAdded");

            tx = await flagsStorage.supportedFlagsMask({from: identityCom});
            tx.toString(2).should.be.equal('1');
        });

        it('Successfully add several flags by daoController, expect success', async () => {
            let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
            let indexArray = [1, 2];

            let tx = await flagsStorage.addFlags(flagCodes, indexArray, {from: identityCom});
            await emitted(tx, "FlagAdded");

            tx = await flagsStorage.supportedFlagsMask({from: identityCom});
            tx.toString(2).should.be.equal('111');
        });

        it('Try to add new flag at already used index, expect revert', async () => {
            await expectRevert(
                flagsStorage.addFlag(hexUnsupportedFlag, 2, {from: identityCom}), "Index already used"
            );
        });

        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                flagsStorage.addFlag(hexUnsupportedFlag, 3, {from: bob}), "NOT DAO ADDRESS"
            );

            await expectRevert(
                flagsStorage.addFlags([hexUnsupportedFlag, hexAccreditedInvestorFlag], [3, 4], {from: bob}), "NOT DAO ADDRESS"
            );
        });

        it('Add new flag and remove support of this flag, expect this index to be at unsupportedFlagsMask', async () => {
            let tx = await flagsStorage.addFlag(hexUnsupportedFlag, 3, {from: identityCom});
            await emitted(tx, "FlagAdded");

            tx = await flagsStorage.supportedFlagsMask({from: identityCom});
            tx.toString(2).should.be.equal('1111');

            tx = await flagsStorage.removeFlag(hexUnsupportedFlag, {from: identityCom});
            await emitted(tx, "FlagRemoved");

            tx = await flagsStorage.unsupportedFlagsMask({from: identityCom});
            tx.toString(2).should.be.equal('1000');
        });
    });

    describe('Test GatewayToken deployment functions', async () => {
        it('Deploy test GatewayToken contract with tKYC symbol', async () => {
            let deployment = await tokenController.createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", forwarder.address, {from: identityCom});
            await emitted(deployment, 'GatekeeperNetworkCreated');

            await gatewayTokens.push(deployment.logs[0].args.tokenAddress);
            gatewayToken = await GatewayToken.at(gatewayTokens[0]);
        });

        it('Try to mint GatewayToken by Bob, expect revert', async () => {
            await expectRevert(
                gatewayToken.mint(bob, 1, 0, 0, { from: bob }), "MUST BE GATEKEEPER"
            );
        });

        it('Successfully add alice as gatekeeper to gateway token contract', async () => {
            let tx = await gatewayToken.addGatekeeper(alice, {from: identityCom});
            await emitted(tx, "RoleGranted");
        });

        it('Expect revert on adding new gatekeeper by Bob', async () => {
            await expectRevert(
                gatewayToken.addGatekeeper(bob, {from: bob}), ""
            );
        });

        it('Successfully mint Gateway Token for Bob by Alice', async () => {
            let tx = await gatewayToken.mint(bob, 1, 0, 0, {from: alice});
            await emitted(tx, "Transfer");

            let tokenOwner = await gatewayToken.ownerOf(1, {from: alice});
            await equal(tokenOwner, bob);

            let bobBalance = await gatewayToken.balanceOf(bob, {from: alice});
            await equal(bobBalance.toString(), '1');

            let tokenID = await gatewayToken.getTokenId(bob, {from: bob});
            await equal(tokenID.toString(), '1');
        });

        it('Expect revert on adding Carol as a gatekeeper and removing gateway token deployer by Alice', async () => {
            await expectRevert(
                gatewayToken.addGatekeeper(carol, {from: alice}), ""
            );

            await expectRevert(
                gatewayToken.removeGatekeeper(identityCom, {from: alice}), ""
            );
        });

        it("Successfully revoke Bob's Gateway Token by Alice", async () => {
            let tx = await gatewayToken.revoke(1, {from: alice});
            await emitted(tx, "Revoke");

            // verify Bob's balance after revoking his gateway token
            let bobBalance = await gatewayToken.balanceOf(bob, {from: alice});
            await equal(bobBalance.toString(), '1');

            tx = await gatewayToken.burn(1, {from: identityCom});
            await emitted(tx, "Transfer");

            // verify Bob's balance after revoking his gateway token
            bobBalance = await gatewayToken.balanceOf(bob, {from: alice});
            await equal(bobBalance.toString(), '0');
        });
    });

    describe('Test adding network authorities via Gateway Token Controller', async () => {
        it('Succesfully add 3 new network authorities to existing tKYC gateway token', async () => {
            let authorities = [alice, bob, carol];
            let tx = await tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: identityCom});
        });

        it('Succesfully add 1 new network authority to existing tKYC gateway token', async () => {
            let authorities = ["0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1"];
            let tx = await tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: identityCom});
        });

        it('Successfully add Bob as a gatekeeper by Alice after becoming network authority', async () => {
            let tx = await gatewayToken.addGatekeeper(bob, {from: alice});
            await emitted(tx, "RoleGranted");
        });

        it("Try to remove non-existing network authorities from tKYC gateway token, don't expect revert", async () => {
            let authorities = ['0x2F60d06Fa6795365B7b42B27Fa23e3e8c8b82f66'];
            let tx = await tokenController.removeNetworkAuthorities(gatewayTokens[0], authorities, {from: identityCom});
        });

        it("Remove 2 network authorities from tKYC gateway token", async () => {
            let authorities = ['0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1', alice];
            let tx = await tokenController.removeNetworkAuthorities(gatewayTokens[0], authorities, {from: identityCom});
        });

        it('Expect revert on adding new network authority by Alice', async () => {
            let authorities = ["0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1"];
            await expectRevert(
                tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: alice}), "INCORRECT ACCESS"
            );
        });

        it('Expect revert on removing existing network authorities by Alice', async () => {
            let authorities = [alice, bob, carol];
            await expectRevert(
                tokenController.removeNetworkAuthorities(gatewayTokens[0], authorities, {from: alice}), "INCORRECT ACCESS"
            );
        });

        it('Succesfully add Alice as a new network authority to existing tKYC gateway token', async () => {
            let authorities = [alice];
            let tx = await tokenController.addNetworkAuthorities(gatewayTokens[0], authorities, {from: identityCom});
        });
    });

    describe('Test gateway token transfers with restricted and accepted transfers for token owners', async () => {
        it('Successfully mint Gateway Token for Alice by admin with tokenID = 1', async () => {
            let tx = await gatewayToken.mint(alice, 1, 0, 0, {from: identityCom});
            await emitted(tx, "Transfer");

            let tokenOwner = await gatewayToken.ownerOf(1, {from: alice});
            await equal(tokenOwner, alice);

            let aliceBalance = await gatewayToken.balanceOf(alice, {from: alice});
            await equal(aliceBalance.toString(), '1');

            let tokenID = await gatewayToken.getTokenId(alice, {from: alice});
            await equal(tokenID.toString(), '1');
        });

        it('Successfully mint Gateway Token for Bob by Alice with tokenID = 2', async () => {
            let tx = await gatewayToken.mint(bob, 2, 0, 0, {from: alice});
            await emitted(tx, "Transfer");

            let tokenID = await gatewayToken.getTokenId(bob, {from: bob});
            await equal(tokenID.toString(), '2');
        });

        it("Successfully transfer Alice's gateway token to Carol account because Bob is a gatekeeper", async () => {
            let tx = await gatewayToken.safeTransferFrom(alice, carol, 1, {from: bob});
            await emitted(tx, "Transfer");
        });

        it("Remove Bob from gatekeepers list, try to transfer 1st tokenId on behalf of Carol, expect revert", async () => {
            let removal = await gatewayToken.removeGatekeeper(bob, {from: alice});
            await emitted(removal, "RoleRevoked");

            await expectRevert(
                gatewayToken.safeTransferFrom(carol, bob, 1, {from: bob}), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );
        });

        it("Try to transfer 1st tokenId by Carol while transfers still restricted", async () => {
            await expectRevert(
                gatewayToken.transferFrom(carol, alice, 1, {from: carol}), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );
        });

        it("Allow tKYC token transfers, try to perform the same transfer again successfully now", async () => {
            let tx = await tokenController.acceptTransfersBatch([gatewayTokens[0]], {from: identityCom});
            await emitted(tx, "TransfersAcceptedBatch");

            tx = await gatewayToken.transferFrom(carol, alice, 1, {from: carol});
            await emitted(tx, "Transfer");
        });

        it('Verify default token held by Alice after receiving from Carol', async () => {
            let validity = await gatewayToken.verifyToken(alice, 1, {from: alice});
            await equal(validity, true);

            let tokenId = await gatewayToken.getTokenId(alice);
            await equal(tokenId.toString(), "1");

            let tokenOwner = await gatewayToken.ownerOf(tokenId);
            await equal(tokenOwner, alice);

            validity = await gatewayToken.verifyToken(alice, {from: carol});
            await equal(validity, true);
        });

        it("Freeze Bob's Gateway Token by Alice. expect revert on setting identity", async () => {
            let tx = await gatewayToken.freeze(2, {from: alice});
            await emitted(tx, "Freeze");

            await expectRevert(
                gatewayToken.setTokenURI(2, "0xSimpleIdenitity", {from: alice}), "TOKEN DOESN'T EXIST OR FROZEN"
            );
        });

        it("Unfreeze Bob's Gateway Token by Alice. set identity, restrict transfers by Carol and don't expect revert on Bob's transfer to Alice because Bob is a Gatekeeper", async () => {
            const identityURI = "0xSimpleIdenitity";
            await expectRevert(
                gatewayToken.unfreeze(2, {from: bob}), "MUST BE GATEKEEPER"
            );

            let tx = await gatewayToken.unfreeze(2, {from: alice});
            await emitted(tx, "Unfreeze");

            tx = await gatewayToken.setTokenURI(2, identityURI, {from: alice});

            let identity = await gatewayToken.getIdentity(2);
            await equal(identity, identityURI);

            tx = await tokenController.restrictTransfersBatch([gatewayTokens[0]], {from: identityCom});
            await emitted(tx, "TransfersRestrictedBatch");

            await expectRevert(
                gatewayToken.transferFrom(bob, alice, 2, {from: bob}), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );

            tx = await gatewayToken.transferFrom(bob, alice, 2, {from: alice});
            await emitted(tx, "Transfer");
        });
    });

    describe('Test gateway token verification with freezed, active, expired tokens and blacklisted users', async () => {
        const carolIdentity = "0xSimpleIdenitity";

        it('Verify existing tokens held by Alice with tokenId 1 and 2', async () => {
            let validity = await gatewayToken.verifyToken(alice, 1, {from: carol});
            await equal(validity, true);

            validity = await gatewayToken.verifyToken(alice, 2, {from: bob});
            await equal(validity, true);

            let tokenId = await gatewayToken.getTokenId(alice);
            await equal(tokenId.toString(), "2");

            let tokenOwner = await gatewayToken.ownerOf(tokenId);
            await equal(tokenOwner, alice);

            validity = await gatewayToken.verifyToken(alice, {from: carol});
            await equal(validity, true);
        });

        it('Freeze 1st token and set expiration for second token', async () => {
            let tx = await gatewayToken.freeze(1, {from: alice});
            await emitted(tx, "Freeze");
            
            // expect default token to be valid
            validity = await gatewayToken.verifyToken(alice, {from: bob});
            await equal(validity, true);

            validity = await gatewayToken.verifyToken(alice, 1, {from: bob});
            await equal(validity, false);

            tx = await gatewayToken.freeze(2, {from: alice});
            await emitted(tx, "Freeze");

            // expect default token to be invalid
            validity = await gatewayToken.verifyToken(alice, {from: bob});
            await equal(validity, false);

            tx = await gatewayToken.unfreeze(2, {from: alice});
            await emitted(tx, "Unfreeze");

            validity = await gatewayToken.verifyToken(alice, {from: bob});
            await equal(validity, true);

            tx = await gatewayToken.setDefaultTokenId(alice, 1, {from: alice});

            let tokenId = await gatewayToken.getTokenId(alice);
            await equal(tokenId.toString(), "1");

            validity = await gatewayToken.verifyToken(alice, {from: bob});
            await equal(validity, false);

            tx = await gatewayToken.setExpiration(2, 12, {from: alice});
            await emitted(tx, "Expiration");
        });

        it('Mint token for Carol, verify first time and blacklist Carol globally', async () => {
            let tx = await gatewayToken.mint(carol, 3, 0, 0, {from: alice});
            await emitted(tx, 'Transfer');

            let tokenOwner = await gatewayToken.ownerOf(3, {from: carol});
            await equal(tokenOwner, carol);

            let carolBalance = await gatewayToken.balanceOf(carol, {from: carol});
            await equal(carolBalance.toString(), '1');

            let tokenID = await gatewayToken.getTokenId(carol, {from: carol});
            await equal(tokenID.toString(), '3');

            tx = await gatewayToken.setTokenURI(3, carolIdentity, {from: alice});
            let identity = await gatewayToken.getIdentity(3);
            await equal(identity, carolIdentity);

            let validity = await gatewayToken.verifyToken(carol, 3, {from: carol});
            await equal(validity, true);
            
            validity = await gatewayToken.verifyToken(carol, {from: carol});
            await equal(validity, true);

            // Blacklisting Carol
            tx = await tokenController.blacklist(carol, {from: identityCom});
            await emitted(tx, "Blacklisted");

            validity = await gatewayToken.verifyToken(carol, 3, {from: carol});
            await equal(validity, false);

            validity = await gatewayToken.verifyToken(carol, {from: carol});
            await equal(validity, false);
        });

        it('Expect revert on minting additional tokens for Carol, freezing and setting expiration. Finally revoke and burn token', async () => {
            await expectRevert(
                gatewayToken.mint(carol, 4, 0, 0, {from: alice}), "BLACKLISTED USER"
            );

            await expectRevert(
                gatewayToken.freeze(3, {from: alice}), "BLACKLISTED USER"
            );

            await expectRevert(
                gatewayToken.setExpiration(3, 1000, {from: alice}), "BLACKLISTED USER"
            );

            // Revoke Carol's token
            tx = await gatewayToken.revoke(3, {from: identityCom});
            await emitted(tx, "Revoke");

            // check 3rd gateway token data
            const tokenState = await gatewayToken.getToken(3, {from: alice});
            tokenState.owner.should.be.equal(carol);
            tokenState.state.toString().should.be.equal('2');
            tokenState.identity.should.be.equal(carolIdentity);
            tokenState.expiration.toString().should.be.equal('0');
            tokenState.bitmask.toString().should.be.equal('0');
        });
    });

    describe('Test gateway token expiry date updates', async () => {
        it('Successfully mint Gateway Token for Alice by admin with tokenID = 10 and set the expiration for 1 day', async () => {
            let tokenExpiration = await getTimestampPlusDays(1);
            let tx = await gatewayToken.mint(alice, 10, tokenExpiration, 0, {from: identityCom});
            await emitted(tx, "Transfer");

            let tokenOwner = await gatewayToken.ownerOf(10, {from: alice});
            await equal(tokenOwner, alice);

            const tokenState = await gatewayToken.getToken(10, {from: alice});
            tokenState.owner.should.be.equal(alice);
            tokenState.state.toString().should.be.equal('0');
            tokenState.identity.should.be.equal('');
            tokenState.expiration.toString().should.be.equal(String(tokenExpiration));
            tokenState.bitmask.toString().should.be.equal('0');
        });

        it('Test bitmask operations for Alice token with tokenID 10', async () => {
            let tx = await gatewayToken.setBitmask(10, 3, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            let bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("11");

            tx = await gatewayToken.addBitmask(10, 4, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("111");

            const tokenState = await gatewayToken.getToken(10, {from: alice});
            tokenState.owner.should.be.equal(alice);
            tokenState.state.toString().should.be.equal('0');
            tokenState.identity.should.be.equal('');
            tokenState.bitmask.toString(2).should.be.equal('111');

            let isHighRisk = await gatewayToken.anyHighRiskBits(10, 5, {from: alice});
            isHighRisk.should.be.equal(true);

            await expectRevert(
                gatewayToken.addBitmask(10, 8, {from: alice}), "UNSUPPORTED BITS"
            );

            await expectRevert(
                gatewayToken.addBit(10, 3, {from: alice}), "UNSUPPORTED BITS"
            );

            tx = await gatewayToken.removeBit(10, 1, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("101");

            tx = await gatewayToken.removeBitmask(10, 5, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("0");

            tx = await gatewayToken.addBit(10, 2, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("100");

            tx = await gatewayToken.clearBitmask(10, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("0");
        });

        it('Add new flags into FlagsStorage contract and add new bits into gateway token', async () => {
            let tx = await flagsStorage.addFlag(hexUnsupportedFlag, 3, {from: identityCom});
            await emitted(tx, "FlagAdded");

            let mask = await flagsStorage.unsupportedFlagsMask({from: identityCom});
            mask.toString(2).should.be.equal('0');

            await expectRevert(
                flagsStorage.addFlag(hexUnsupportedFlag, 4, {from: identityCom}), "Flag already exist"
            );

            tx = await flagsStorage.addFlag(hexUnsupportedFlag2, 4, {from: identityCom});
            await emitted(tx, "FlagAdded");

            mask = await flagsStorage.supportedFlagsMask({from: identityCom});
            mask.toString(2).should.be.equal('11111');

            tx = await gatewayToken.addBitmask(10, 24, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("11000");

            tx = await flagsStorage.removeFlags([hexUnsupportedFlag, hexUnsupportedFlag2], {from: identityCom});
            await emitted(tx, "FlagRemoved");

            mask = await flagsStorage.unsupportedFlagsMask({from: identityCom});
            mask.toString(2).should.be.equal('11000');

            tx = await gatewayToken.removeUnsupportedBits(10, {from: alice});
            await emitted(tx, "BitMaskUpdated");

            bitmask = await gatewayToken.getTokenBitmask(10, {from: alice});
            bitmask.toString(2).should.be.equal("0");

            await expectRevert(
                gatewayToken.addBit(10, 4, {from: alice}), "UNSUPPORTED BITS"
            );
        });
    });
});
