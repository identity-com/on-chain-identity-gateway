import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { 
    toBytes32,
    reverted as expectRevert,
    equal,
    getTimestampPlusDays
} from './utils';

import { should, expect } from 'chai';
// const { getTimestampPlusDays } = require('./utils').time;

describe('GatewayTokenController', async () => {
    let signers: SignerWithAddress[];
    let identityCom: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;

    let forwarder: Contract;
    let tokenController: Contract;
    let flagsStorage: Contract;
    let gatewayTokens: Contract[] = [];
    let gatewayToken: Contract;

    let hexRetailFlag = toBytes32("Retail");
    let hexInstitutionFlag = toBytes32("Institution");
    let hexAccreditedInvestorFlag = toBytes32("AccreditedInvestor");
    let hexUnsupportedFlag = toBytes32("hexUnsupportedFlag");
    let hexUnsupportedFlag2 = toBytes32("hexUnsupportedFlag2");

    before('deploy contracts', async () => {
        signers = await ethers.getSigners();
        identityCom = signers[0];
        alice = signers[1];
        bob = signers[2];
        carol = signers[3];

        const forwarderFactory = await ethers.getContractFactory("Forwarder");
        const flagsStorageFactory = await ethers.getContractFactory("FlagsStorage");
        const tokenControllerFactory = await ethers.getContractFactory("GatewayTokenController");

        forwarder = await forwarderFactory.deploy();
        await forwarder.deployed();

        flagsStorage = await flagsStorageFactory.deploy(identityCom.address);
        flagsStorage.deployed();

        tokenController = await tokenControllerFactory.deploy(flagsStorage.address);
        await tokenController.deployed();
    });

    describe('Test executing functions only for Identity.com admin by third-party address', async () => {
        it('Try to change token controller admin by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                tokenController.connect(bob).transferAdmin(bob.address), "NOT IDENTITY_COM_ADMIN"
            );
        });
    });

    describe('Test FlagsStorage smart contract', async () => {
        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                tokenController.connect(bob).transferAdmin(bob.address), "NOT IDENTITY_COM_ADMIN"
            );
        });

        it('Successfully add flag by daoController, expect success', async () => {
            let tx = await flagsStorage.connect(identityCom).addFlag(hexRetailFlag, 0);

            tx = await flagsStorage.supportedFlagsMask();
            await equal(tx.toBigInt().toString(2), '1');
        });

        it('Successfully add several flags by daoController, expect success', async () => {
            let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
            let indexArray = [1, 2];

            await flagsStorage.addFlags(flagCodes, indexArray);

            let tx = await flagsStorage.supportedFlagsMask();
            await equal(tx.toBigInt().toString(2), '111');
        });

        it('Try to add new flag at already used index, expect revert', async () => {
            await expectRevert(
                flagsStorage.addFlag(hexUnsupportedFlag, 2), "Index already used"
            );
        });

        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expectRevert(
                flagsStorage.connect(bob).addFlag(hexUnsupportedFlag, 4), "NOT DAO ADDRESS"
            );

            await expectRevert(
                flagsStorage.connect(bob).addFlags([hexUnsupportedFlag, hexAccreditedInvestorFlag], [3, 4]), "NOT DAO ADDRESS"
            );
        });

        it('Add new flag and remove support of this flag, expect this index to be at unsupportedFlagsMask', async () => {
            let tx = await flagsStorage.connect(identityCom).addFlag(hexUnsupportedFlag, 3);

            tx = await flagsStorage.supportedFlagsMask();
            await equal(tx.toBigInt().toString(2), '1111');

            await flagsStorage.removeFlag(hexUnsupportedFlag);

            tx = await flagsStorage.unsupportedFlagsMask();
            await equal(tx.toBigInt().toString(2), '1000');
        });
    });

    describe('Test GatewayToken deployment functions', async () => {
        it('Deploy test GatewayToken contract with tKYC symbol', async () => {
            let deployment = await tokenController.connect(identityCom).createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", forwarder.address);
            const receipt = await deployment.wait();
            const gatewayTokenAddress = receipt.events[receipt.events.length - 1].args.tokenAddress;

            gatewayToken = await ethers.getContractAt('GatewayToken', gatewayTokenAddress);
            await gatewayTokens.push(gatewayToken);
        });

        it('Try to mint GatewayToken by Bob, expect revert', async () => {
            await expectRevert(
                gatewayToken.connect(bob).mint(bob.address, 1, 0, 0), "MUST BE GATEKEEPER"
            );
        });

        it('Successfully add alice as gatekeeper to gateway token contract', async () => {
            await gatewayToken.connect(identityCom).addGatekeeper(alice.address);
        });

        it('Expect revert on adding new gatekeeper by Bob', async () => {
            await expectRevert(
                gatewayToken.connect(bob).addGatekeeper(bob.address), ""
            );
        });

        it('Successfully mint Gateway Token for Bob by Alice', async () => {
            await gatewayToken.connect(alice).mint(bob.address, 1, 0, 0);

            let tokenOwner = await gatewayToken.ownerOf(1);
            await equal(tokenOwner, bob.address);

            let bobBalance = await gatewayToken.balanceOf(bob.address);
            await equal(bobBalance.toString(), '1');

            let tokenID = await gatewayToken.getTokenId(bob.address);
            await equal(tokenID.toString(), '1');
        });

        it('Expect revert on adding Carol as a gatekeeper and removing gateway token deployer by Alice', async () => {
            await expectRevert(
                gatewayToken.connect(alice).addGatekeeper(carol.address), ""
            );

            await expectRevert(
                gatewayToken.connect(alice).removeGatekeeper(identityCom.address), ""
            );
        });

        it("Successfully revoke Bob's Gateway Token by Alice", async () => {
            await gatewayToken.connect(alice).revoke(1);

            // verify Bob's balance after revoking his gateway token
            let bobBalance = await gatewayToken.balanceOf(bob.address);
            await equal(bobBalance.toString(), '1');

            await gatewayToken.connect(identityCom).burn(1);

            // verify Bob's balance after revoking his gateway token
            bobBalance = await gatewayToken.balanceOf(bob.address);
            await equal(bobBalance.toString(), '0');
        });
    });

    describe('Test adding network authorities via Gateway Token Controller', async () => {
        it('Succesfully add 3 new network authorities to existing tKYC gateway token', async () => {
            let authorities = [alice.address, bob.address, carol.address];
            await tokenController.connect(identityCom).addNetworkAuthorities(gatewayTokens[0].address, authorities);
        });

        it('Succesfully add 1 new network authority to existing tKYC gateway token', async () => {
            let authorities = ["0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1"];
            await tokenController.addNetworkAuthorities(gatewayTokens[0].address, authorities);
        });

        it('Successfully add Bob as a gatekeeper by Alice after becoming network authority', async () => {
            await gatewayToken.connect(alice).addGatekeeper(bob.address);
        });

        it("Try to remove non-existing network authorities from tKYC gateway token, don't expect revert", async () => {
            let authorities = ['0x2F60d06Fa6795365B7b42B27Fa23e3e8c8b82f66'];
            await tokenController.connect(identityCom).removeNetworkAuthorities(gatewayTokens[0].address, authorities);
        });

        it("Remove 2 network authorities from tKYC gateway token", async () => {
            let authorities = ['0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1', alice.address];
            await tokenController.removeNetworkAuthorities(gatewayTokens[0].address, authorities);
        });

        it('Expect revert on adding new network authority by Alice', async () => {
            let authorities = ["0xc365c3315cF926351CcAf13fA7D19c8C4058C8E1"];
            await expectRevert(
                tokenController.connect(alice).addNetworkAuthorities(gatewayTokens[0].address, authorities), "INCORRECT ACCESS"
            );
        });

        it('Expect revert on removing existing network authorities by Alice', async () => {
            let authorities = [alice.address, bob.address, carol.address];
            await expectRevert(
                tokenController.connect(alice).removeNetworkAuthorities(gatewayTokens[0].address, authorities), "INCORRECT ACCESS"
            );
        });

        it('Succesfully add Alice as a new network authority to existing tKYC gateway token', async () => {
            let authorities = [alice.address];
            await tokenController.connect(identityCom).addNetworkAuthorities(gatewayTokens[0].address, authorities);
        });
    });

    describe('Test gateway token transfers with restricted and accepted transfers for token owners', async () => {
        it('Successfully mint Gateway Token for Alice by admin with tokenID = 1', async () => {
            let tx = await gatewayToken.connect(identityCom).mint(alice.address, 1, 0, 0);

            let tokenOwner = await gatewayToken.ownerOf(1);
            await equal(tokenOwner, alice.address);

            let aliceBalance = await gatewayToken.balanceOf(alice.address);
            await equal(aliceBalance.toString(), '1');

            let tokenID = await gatewayToken.getTokenId(alice.address);
            await equal(tokenID.toString(), '1');
        });

        it('Successfully mint Gateway Token for Bob by Alice with tokenID = 2', async () => {
            await gatewayToken.connect(alice).mint(bob.address, 2, 0, 0);

            let tokenID = await gatewayToken.getTokenId(bob.address);
            await equal(tokenID.toString(), '2');
        });

        it("Successfully transfer Alice's gateway token to Carol account because Bob is a gatekeeper", async () => {
            await gatewayToken.connect(bob).transferFrom(alice.address, carol.address, 1);
        });

        it("Remove Bob from gatekeepers list, try to transfer 1st tokenId on behalf of Carol, expect revert", async () => {
            let removal = await gatewayToken.connect(alice).removeGatekeeper(bob.address);

            await expectRevert(
                gatewayToken.connect(bob).transferFrom(carol.address, bob.address, 1), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );
        });

        it("Try to transfer 1st tokenId by Carol while transfers still restricted", async () => {
            await expectRevert(
                gatewayToken.connect(carol).transferFrom(carol.address, alice.address, 1), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );
        });

        it("Allow tKYC token transfers, try to perform the same transfer again successfully now", async () => {
            let tx = await tokenController.connect(identityCom).acceptTransfersBatch([gatewayTokens[0].address]);

            tx = await gatewayToken.connect(carol).transferFrom(carol.address, alice.address, 1);
        });

        it('Verify default token held by Alice after receiving from Carol', async () => {
            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 1);
            await equal(validity[0], true);

            let tokenId = await gatewayToken.getTokenId(alice.address);
            await equal(tokenId.toString(), "1");

            let tokenOwner = await gatewayToken.ownerOf(tokenId);
            await equal(tokenOwner, alice.address);

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            await equal(validity[0], true);
        });

        it("Freeze Bob's Gateway Token by Alice. expect revert on setting identity", async () => {
            let tx = await gatewayToken.connect(alice).freeze(2);

            await expectRevert(
                gatewayToken.connect(alice).setTokenURI(2, "0xSimpleIdenitity"), "TOKEN DOESN'T EXIST OR FROZEN"
            );
        });

        it("Unfreeze Bob's Gateway Token by Alice. set identity, restrict transfers by Carol and don't expect revert on Bob's transfer to Alice because Bob is a Gatekeeper", async () => {
            const identityURI = "0xSimpleIdenitity";
            await expectRevert(
                gatewayToken.connect(bob).unfreeze(2), "MUST BE GATEKEEPER"
            );

            let tx = await gatewayToken.connect(alice).unfreeze(2);

            tx = await gatewayToken.setTokenURI(2, identityURI);

            let identity = await gatewayToken.getIdentity(2);
            await equal(identity, identityURI);

            tx = await tokenController.connect(identityCom).restrictTransfersBatch([gatewayTokens[0].address]);

            await expectRevert(
                gatewayToken.connect(bob).transferFrom(bob.address, alice.address, 2), "MSG.SENDER NOT OWNER NOR GATEKEEPER"
            );

            tx = await gatewayToken.connect(alice).transferFrom(bob.address, alice.address, 2);
        });
    });

    describe('Test gateway token verification with freezed, active, expired tokens and blacklisted users', async () => {
        const carolIdentity = "0xSimpleIdenitity";

        it('Verify existing tokens held by Alice with tokenId 1 and 2', async () => {
            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 1);
            await equal(validity[0], true);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 2);
            await equal(validity[0], true);

            let tokenId = await gatewayToken.getTokenId(alice.address);
            await equal(tokenId.toString(), "2");

            let tokenOwner = await gatewayToken.ownerOf(tokenId);
            await equal(tokenOwner, alice.address);

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            await equal(validity[0], true);
        });

        it('Freeze 1st token and set expiration for second token', async () => {
            let tx = await gatewayToken.connect(alice).freeze(1);

            // expect default token to be valid
            let validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            await equal(validity[0], true);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 1);
            await equal(validity[0], false);

            await gatewayToken.connect(alice).freeze(2);

            // expect default token to be invalid
            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            await equal(validity[0], false);

            await gatewayToken.connect(alice).unfreeze(2);

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            await equal(validity[0], true);

            await gatewayToken.connect(alice).setDefaultTokenId(alice.address, 1);

            let tokenId = await gatewayToken.getTokenId(alice.address);
            await equal(tokenId.toString(), "1");

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            await equal(validity[0], false);

            await gatewayToken.connect(alice).setExpiration(2, 12);
        });

        it('Mint token for Carol, verify first time and blacklist Carol globally', async () => {
            let tx = await gatewayToken.connect(alice).mint(carol.address, 3, 0, 0);

            let tokenOwner = await gatewayToken.ownerOf(3);
            await equal(tokenOwner, carol.address);

            let carolBalance = await gatewayToken.balanceOf(carol.address);
            await equal(carolBalance.toString(), '1');

            let tokenID = await gatewayToken.getTokenId(carol.address);
            await equal(tokenID.toString(), '3');

            tx = await gatewayToken.connect(alice).setTokenURI(3, carolIdentity);
            let identity = await gatewayToken.getIdentity(3);
            await equal(identity, carolIdentity);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](carol.address, 3);
            await equal(validity[0], true);
            
            validity = await gatewayToken.functions['verifyToken(address)'](carol.address);
            await equal(validity[0], true);

            // Blacklisting Carol
            tx = await tokenController.connect(identityCom).blacklist(carol.address);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](carol.address, 3);
            await equal(validity[0], false);

            validity = await gatewayToken.functions['verifyToken(address)'](carol.address);
            await equal(validity[0], false);
        });

        it('Expect revert on minting additional tokens for Carol, freezing and setting expiration. Finally revoke and burn token', async () => {
            await expectRevert(
                gatewayToken.connect(alice).mint(carol.address, 4, 0, 0), "BLACKLISTED USER"
            );

            await expectRevert(
                gatewayToken.connect(alice).freeze(3), "BLACKLISTED USER"
            );

            await expectRevert(
                gatewayToken.connect(alice).setExpiration(3, 1000), "BLACKLISTED USER"
            );

            // Revoke Carol's token
            await gatewayToken.connect(identityCom).revoke(3);

            // check 3rd gateway token data
            const tokenState = await gatewayToken.getToken(3);
            await equal(tokenState.owner, carol.address);
            await equal(tokenState.state.toString(), '2');
            await equal(tokenState.identity, carolIdentity);
            await equal(tokenState.expiration.toString(), '0');
            await equal(tokenState.bitmask.toString(), '0');
        });
    });

    describe('Test gateway token expiry date updates', async () => {
        it('Successfully mint Gateway Token for Alice by admin with tokenID = 10 and set the expiration for 1 day', async () => {
            let tokenExpiration = await getTimestampPlusDays(1);
            await gatewayToken.connect(identityCom).mint(alice.address, 10, tokenExpiration, 0);

            let tokenOwner = await gatewayToken.ownerOf(10);
            await equal(tokenOwner, alice.address);

            const tokenState = await gatewayToken.getToken(10);
            await equal(tokenState.owner, alice.address);
            await equal(tokenState.state.toString(), '0');
            await equal(tokenState.identity, '');
            await equal(tokenState.expiration.toString(), String(tokenExpiration));
            await equal(tokenState.bitmask.toString(), '0');
        });

        it('Test bitmask operations for Alice token with tokenID 10', async () => {
            let tx = await gatewayToken.connect(alice).setBitmask(10, 3);

            let bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '11');

            tx = await gatewayToken.connect(alice).addBitmask(10, 4);

            bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '111');

            const tokenState = await gatewayToken.getToken(10);
            await equal(tokenState.bitmask.toBigInt().toString(2), '111');

            let isHighRisk = await gatewayToken.anyHighRiskBits(10, 5);
            await equal(isHighRisk, true);

            await expectRevert(
                gatewayToken.connect(alice).addBitmask(10, 8), "UNSUPPORTED BITS"
            );

            await expectRevert(
                gatewayToken.connect(alice).addBit(10, 3), "UNSUPPORTED BITS"
            );

            tx = await gatewayToken.removeBit(10, 1);

            bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '101');

            tx = await gatewayToken.removeBitmask(10, 5);

            bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '0');

            tx = await gatewayToken.addBit(10, 2);

            bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '100');

            tx = await gatewayToken.clearBitmask(10);

            bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '0');
        });

        it('Add new flags into FlagsStorage contract and add new bits into gateway token', async () => {
            let tx = await flagsStorage.connect(identityCom).addFlag(hexUnsupportedFlag, 3);

            let mask = await flagsStorage.unsupportedFlagsMask();
            await equal(mask.toBigInt().toString(2), '0');

            await expectRevert(
                flagsStorage.connect(identityCom).addFlag(hexUnsupportedFlag, 4), "Flag already exist"
            );

            tx = await flagsStorage.addFlag(hexUnsupportedFlag2, 4);

            mask = await flagsStorage.supportedFlagsMask();
            await equal(mask.toBigInt().toString(2), '11111');

            await gatewayToken.connect(alice).addBitmask(10, 24);

            let bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(mask.toBigInt().toString(2), '11111');

            await flagsStorage.connect(identityCom).removeFlags([hexUnsupportedFlag, hexUnsupportedFlag2]);

            mask = await flagsStorage.unsupportedFlagsMask();
            await equal(mask.toBigInt().toString(2), '11000');

            tx = await gatewayToken.removeUnsupportedBits(10);

            bitmask = await gatewayToken.getTokenBitmask(10);
            await equal(bitmask.toBigInt().toString(2), '0');

            await expectRevert(
                gatewayToken.connect(alice).addBit(10, 4), "UNSUPPORTED BITS"
            );
        });
    });
});
