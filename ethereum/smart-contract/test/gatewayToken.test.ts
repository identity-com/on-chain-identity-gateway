import { ethers } from "hardhat";
import { Contract} from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { 
    toBytes32,
    getTimestampPlusDays
} from './utils';

import { expect } from 'chai';
import {NULL_CHARGE, randomAddress} from "./utils/eth";

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
        await flagsStorage.deployed();

        tokenController = await tokenControllerFactory.deploy(flagsStorage.address);
        await tokenController.deployed();
    });

    describe('Test executing functions only for Identity.com admin by third-party address', async () => {
        it('Try to change token controller admin by Bob, expect revert due to invalid access', async () => {
            await expect(
                tokenController.connect(bob).transferAdmin(bob.address)
            ).to.be.revertedWith("NOT IDENTITY_COM_ADMIN");
        });
    });

    describe('Test FlagsStorage smart contract', async () => {
        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expect(
                tokenController.connect(bob).transferAdmin(bob.address)
            ).to.be.revertedWith("NOT IDENTITY_COM_ADMIN");
        });

        it('Successfully add flag by daoController, expect success', async () => {
            await flagsStorage.connect(identityCom).addFlag(hexRetailFlag, 0);

            let tx = await flagsStorage.supportedFlagsMask();
            expect(tx.toBigInt().toString(2)).to.equal('1');
        });

        it('Successfully add several flags by daoController, expect success', async () => {
            let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
            let indexArray = [1, 2];

            await flagsStorage.addFlags(flagCodes, indexArray);

            let tx = await flagsStorage.supportedFlagsMask();
            expect(tx.toBigInt().toString(2)).to.equal('111');
        });

        it('Try to add new flag at already used index, expect revert', async () => {
            await expect(
                flagsStorage.addFlag(hexUnsupportedFlag, 2)
            ).to.be.revertedWith("Index already used");
        });

        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expect(
                flagsStorage.connect(bob).addFlag(hexUnsupportedFlag, 4)
            ).to.be.revertedWith("NOT DAO ADDRESS");

            await expect(
                flagsStorage.connect(bob).addFlags([hexUnsupportedFlag, hexAccreditedInvestorFlag], [3, 4])
            ).to.be.revertedWith("NOT DAO ADDRESS");
        });

        it('Add new flag and remove support of this flag, expect this index to be at unsupportedFlagsMask', async () => {
            await flagsStorage.connect(identityCom).addFlag(hexUnsupportedFlag, 3);

            let tx = await flagsStorage.supportedFlagsMask();
            expect(tx.toBigInt().toString(2)).to.equal('1111');

            await flagsStorage.removeFlag(hexUnsupportedFlag);

            tx = await flagsStorage.unsupportedFlagsMask();
            expect(tx.toBigInt().toString(2)).to.equal('1000');
        });
    });

    describe('Test GatewayToken deployment functions', async () => {
        it('Deploy test GatewayToken contract with tKYC symbol', async () => {
            let deployment = await tokenController.connect(identityCom).createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", forwarder.address);
            const receipt = await deployment.wait();
            const gatewayTokenAddress = receipt.events[receipt.events.length - 1].args.tokenAddress;

            gatewayToken = await ethers.getContractAt('GatewayToken', gatewayTokenAddress);
            gatewayTokens.push(gatewayToken);
        });

        it('Try to mint GatewayToken by Bob, expect revert', async () => {
            await expect(
                gatewayToken.connect(bob).mint(bob.address, 1, 0, 0, NULL_CHARGE)
            ).to.be.revertedWith("MUST BE GATEKEEPER");
        });

        it('Successfully add alice as gatekeeper to gateway token contract', async () => {
            await gatewayToken.connect(identityCom).addGatekeeper(alice.address);
        });

        it('Expect revert on adding new gatekeeper by Bob', async () => {
            await expect(
                gatewayToken.connect(bob).addGatekeeper(bob.address)
            ).to.be.revertedWith("");
        });

        it('Successfully mint Gateway Token for Bob by Alice', async () => {
            await gatewayToken.connect(alice).mint(bob.address, 1, 0, 0, NULL_CHARGE);

            let tokenOwner = await gatewayToken.ownerOf(1);
            expect(tokenOwner).to.equal(bob.address);

            let bobBalance = await gatewayToken.balanceOf(bob.address);
            expect(bobBalance.toString()).to.equal('1');

            let tokenID = await gatewayToken.getTokenId(bob.address);
            expect(tokenID.toString()).to.equal('1');
        });

        it('Expect revert on adding Carol as a gatekeeper and removing gateway token deployer by Alice', async () => {
            await expect(
                gatewayToken.connect(alice).addGatekeeper(carol.address)
            ).to.be.revertedWith("");

            await expect(
                gatewayToken.connect(alice).removeGatekeeper(identityCom.address)
            ).to.be.revertedWith("");
        });

        it("Successfully revoke Bob's Gateway Token by Alice", async () => {
            await gatewayToken.connect(alice).revoke(1);

            // verify Bob's balance after revoking his gateway token
            let bobBalance = await gatewayToken.balanceOf(bob.address);
            expect(bobBalance.toString()).to.equal('1');

            await gatewayToken.connect(identityCom).burn(1);

            // verify Bob's balance after revoking his gateway token
            bobBalance = await gatewayToken.balanceOf(bob.address);
            expect(bobBalance.toString()).to.equal('0');
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
            await expect(
                tokenController.connect(alice).addNetworkAuthorities(gatewayTokens[0].address, authorities)
            ).to.be.revertedWith("INCORRECT ACCESS");
        });

        it('Expect revert on removing existing network authorities by Alice', async () => {
            let authorities = [alice.address, bob.address, carol.address];
            await expect(
                tokenController.connect(alice).removeNetworkAuthorities(gatewayTokens[0].address, authorities)
            ).to.be.revertedWith("INCORRECT ACCESS");
        });

        it('Succesfully add Alice as a new network authority to existing tKYC gateway token', async () => {
            let authorities = [alice.address];
            await tokenController.connect(identityCom).addNetworkAuthorities(gatewayTokens[0].address, authorities);
        });
    });

    describe('Test gateway token transfers with restricted and accepted transfers for token owners', async () => {
        it('Successfully mint Gateway Token for Alice by admin with tokenID = 1', async () => {
            await gatewayToken.connect(identityCom).mint(alice.address, 1, 0, 0, NULL_CHARGE);

            let tokenOwner = await gatewayToken.ownerOf(1);
            expect(tokenOwner).to.equal(alice.address);

            let aliceBalance = await gatewayToken.balanceOf(alice.address);
            expect(aliceBalance.toString()).to.equal('1');

            let tokenID = await gatewayToken.getTokenId(alice.address);
            expect(tokenID.toString()).to.equal('1');
        });

        it('Successfully mint Gateway Token for Bob by Alice with tokenID = 2', async () => {
            await gatewayToken.connect(alice).mint(bob.address, 2, 0, 0, NULL_CHARGE);

            let tokenID = await gatewayToken.getTokenId(bob.address);
            expect(tokenID.toString()).to.equal('2');
        });

        it("Successfully transfer Alice's gateway token to Carol account because Bob is a gatekeeper", async () => {
            await gatewayToken.connect(bob).transferFrom(alice.address, carol.address, 1);
        });

        it("Remove Bob from gatekeepers list, try to transfer 1st tokenId on behalf of Carol, expect revert", async () => {
            await gatewayToken.connect(alice).removeGatekeeper(bob.address);

            await expect(
                gatewayToken.connect(bob).transferFrom(carol.address, bob.address, 1)
            ).to.be.revertedWith("MSG.SENDER NOT OWNER NOR GATEKEEPER");
        });

        it("Try to transfer 1st tokenId by Carol while transfers still restricted", async () => {
            await expect(
                gatewayToken.connect(carol).transferFrom(carol.address, alice.address, 1)
            ).to.be.revertedWith("MSG.SENDER NOT OWNER NOR GATEKEEPER");
        });

        it("Allow tKYC token transfers, try to perform the same transfer again successfully now", async () => {
            await tokenController.connect(identityCom).acceptTransfersBatch([gatewayTokens[0].address]);

            await gatewayToken.connect(carol).transferFrom(carol.address, alice.address, 1);
        });

        it('Verify default token held by Alice after receiving from Carol', async () => {
            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 1);
            expect(validity[0]).to.equal(true);

            let tokenId = await gatewayToken.getTokenId(alice.address);
            expect(tokenId.toString()).to.equal("1");

            let tokenOwner = await gatewayToken.ownerOf(tokenId);
            expect(tokenOwner).to.equal(alice.address);

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            expect(validity[0]).to.equal(true);
        });

        it("Freeze Bob's Gateway Token by Alice. expect revert on setting identity", async () => {
            await gatewayToken.connect(alice).freeze(2);

            await expect(
                gatewayToken.connect(alice).setTokenURI(2, "0xSimpleIdenitity")
            ).to.be.revertedWith("TOKEN DOESN'T EXIST OR FROZEN");
        });

        it("Unfreeze Bob's Gateway Token by Alice. set identity, restrict transfers by Carol and don't expect revert on Bob's transfer to Alice because Bob is a Gatekeeper", async () => {
            const identityURI = "0xSimpleIdenitity";
            await expect(
                gatewayToken.connect(bob).unfreeze(2)
            ).to.be.revertedWith("MUST BE GATEKEEPER");

            await gatewayToken.connect(alice).unfreeze(2);

            await gatewayToken.setTokenURI(2, identityURI);

            let identity = await gatewayToken.getIdentity(2);
            expect(identity).to.equal(identityURI);

            await tokenController.connect(identityCom).restrictTransfersBatch([gatewayTokens[0].address]);

            await expect(
                gatewayToken.connect(bob).transferFrom(bob.address, alice.address, 2)
            ).to.be.revertedWith("MSG.SENDER NOT OWNER NOR GATEKEEPER");

            await gatewayToken.connect(alice).transferFrom(bob.address, alice.address, 2);
        });
    });

    describe('Test gateway token verification with freezed, active, expired tokens and blacklisted users', async () => {
        const carolIdentity = "0xSimpleIdenitity";

        it('Verify existing tokens held by Alice with tokenId 1 and 2', async () => {
            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 1);
            expect(validity[0]).to.equal(true);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 2);
            expect(validity[0]).to.equal(true);

            let tokenId = await gatewayToken.getTokenId(alice.address);
            expect(tokenId.toString()).to.equal("2");

            let tokenOwner = await gatewayToken.ownerOf(tokenId);
            expect(tokenOwner).to.equal(alice.address);

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            expect(validity[0]).to.equal(true);
        });

        it('Freeze 1st token and set expiration for second token', async () => {
            await gatewayToken.connect(alice).freeze(1);

            // expect default token to be valid
            let validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            expect(validity[0]).to.equal(true);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, 1);
            expect(validity[0]).to.equal(false);

            await gatewayToken.connect(alice).freeze(2);

            // expect default token to be invalid
            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            expect(validity[0]).to.equal(false);

            await gatewayToken.connect(alice).unfreeze(2);

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            expect(validity[0]).to.equal(true);

            await gatewayToken.connect(alice).setDefaultTokenId(alice.address, 1);

            let tokenId = await gatewayToken.getTokenId(alice.address);
            expect(tokenId.toString()).to.equal("1");

            validity = await gatewayToken.functions['verifyToken(address)'](alice.address);
            expect(validity[0]).to.equal(false);

            await gatewayToken.connect(alice).setExpiration(2, 12, NULL_CHARGE);
        });

        it('Mint token for Carol, verify first time and blacklist Carol globally', async () => {
            await gatewayToken.connect(alice).mint(carol.address, 3, 0, 0, NULL_CHARGE);

            let tokenOwner = await gatewayToken.ownerOf(3);
            expect(tokenOwner).to.equal(carol.address);

            let carolBalance = await gatewayToken.balanceOf(carol.address);
            expect(carolBalance.toString()).to.equal('1');

            let tokenID = await gatewayToken.getTokenId(carol.address);
            expect(tokenID.toString()).to.equal('3');

            await gatewayToken.connect(alice).setTokenURI(3, carolIdentity);
            let identity = await gatewayToken.getIdentity(3);
            expect(identity).to.equal(carolIdentity);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](carol.address, 3);
            expect(validity[0]).to.equal(true);

            validity = await gatewayToken.functions['verifyToken(address)'](carol.address);
            expect(validity[0]).to.equal(true);

            // Blacklisting Carol
            await tokenController.connect(identityCom).blacklist(carol.address);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](carol.address, 3);
            expect(validity[0]).to.equal(false);

            validity = await gatewayToken.functions['verifyToken(address)'](carol.address);
            expect(validity[0]).to.equal(false);
        });

        it('Expect revert on minting additional tokens for Carol, freezing and setting expiration. Finally revoke and burn token', async () => {
            await expect(
                gatewayToken.connect(alice).mint(carol.address, 4, 0, 0, NULL_CHARGE)
            ).to.be.revertedWith("BLACKLISTED USER");

            await expect(
                gatewayToken.connect(alice).freeze(3)
            ).to.be.revertedWith("BLACKLISTED USER");

            await expect(
                gatewayToken.connect(alice).setExpiration(3, 1000, NULL_CHARGE)
            ).to.be.revertedWith("BLACKLISTED USER");

            // Revoke Carol's token
            await gatewayToken.connect(identityCom).revoke(3);

            // check 3rd gateway token data
            const tokenState = await gatewayToken.getToken(3);
            expect(tokenState.owner).to.equal(carol.address);
            expect(tokenState.state.toString()).to.equal('2');
            expect(tokenState.identity).to.equal(carolIdentity);
            expect(tokenState.expiration.toString()).to.equal('0');
            expect(tokenState.bitmask.toString()).to.equal('0');
        });
    });

    describe('Test gateway token expiry date updates', async () => {
        it('Successfully mint Gateway Token for Alice by admin with tokenID = 10 and set the expiration for 1 day', async () => {
            let tokenExpiration = await getTimestampPlusDays(1);
            await gatewayToken.connect(identityCom).mint(alice.address, 10, tokenExpiration, 0, NULL_CHARGE);

            let tokenOwner = await gatewayToken.ownerOf(10);
            expect(tokenOwner).to.equal(alice.address);

            const tokenState = await gatewayToken.getToken(10);
            expect(tokenState.owner).to.equal(alice.address);
            expect(tokenState.state.toString()).to.equal('0');
            expect(tokenState.identity).to.equal('');
            expect(tokenState.expiration.toString()).to.equal(String(tokenExpiration));
            expect(tokenState.bitmask.toString()).to.equal('0');
        });

        it('Test bitmask operations for Alice token with tokenID 10', async () => {
            await gatewayToken.connect(alice).setBitmask(10, 3);

            let bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('11');

            await gatewayToken.connect(alice).addBitmask(10, 4);

            bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('111');

            const tokenState = await gatewayToken.getToken(10);
            expect(tokenState.bitmask.toBigInt().toString(2)).to.equal('111');

            let isHighRisk = await gatewayToken.anyHighRiskBits(10, 5);
            expect(isHighRisk).to.equal(true);

            await expect(
                gatewayToken.connect(alice).addBitmask(10, 8)
            ).to.be.revertedWith("UNSUPPORTED BITS");

            await expect(
                gatewayToken.connect(alice).addBit(10, 3)
            ).to.be.revertedWith("UNSUPPORTED BITS");

            await gatewayToken.removeBit(10, 1);

            bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('101');

            await gatewayToken.removeBitmask(10, 5);

            bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('0');

            await gatewayToken.addBit(10, 2);

            bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('100');

            await gatewayToken.clearBitmask(10);

            bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('0');
        });

        it('Add new flags into FlagsStorage contract and add new bits into gateway token', async () => {
            await flagsStorage.connect(identityCom).addFlag(hexUnsupportedFlag, 3);

            let mask = await flagsStorage.unsupportedFlagsMask();
            expect(mask.toBigInt().toString(2)).to.equal('0');

            await expect(
                flagsStorage.connect(identityCom).addFlag(hexUnsupportedFlag, 4)
            ).to.be.revertedWith("Flag already exist");

            await flagsStorage.addFlag(hexUnsupportedFlag2, 4);

            mask = await flagsStorage.supportedFlagsMask();
            expect(mask.toBigInt().toString(2)).to.equal('11111');

            await gatewayToken.connect(alice).addBitmask(10, 24);

            let bitmask = await gatewayToken.getTokenBitmask(10);
            expect(mask.toBigInt().toString(2)).to.equal('11111');

            await flagsStorage.connect(identityCom).removeFlags([hexUnsupportedFlag, hexUnsupportedFlag2]);

            mask = await flagsStorage.unsupportedFlagsMask();
            expect(mask.toBigInt().toString(2)).to.equal('11000');

            await gatewayToken.removeUnsupportedBits(10);

            bitmask = await gatewayToken.getTokenBitmask(10);
            expect(bitmask.toBigInt().toString(2)).to.equal('0');

            await expect(
                gatewayToken.connect(alice).addBit(10, 4)
            ).to.be.revertedWith("UNSUPPORTED BITS");
        });
    });

    describe('Test gateway token forwarder functions', async () => {
        it('Checks a forwarder exists', async () => {
            expect(await gatewayToken.isTrustedForwarder(forwarder.address)).to.equal(true);
        });
        it('Successfully add a forwarder', async () => {
            const newForwarder = randomAddress();
            await gatewayToken.connect(identityCom).addForwarder(newForwarder);

            expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(true);
        });

        it('Successfully removes a forwarder', async () => {
            const newForwarder = randomAddress();
            await gatewayToken.connect(identityCom).addForwarder(newForwarder);
            await gatewayToken.connect(identityCom).removeForwarder(newForwarder);

            expect(await gatewayToken.isTrustedForwarder(newForwarder)).to.equal(false);
        });
    });
});
