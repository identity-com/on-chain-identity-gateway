import { ethers } from "hardhat";
import {BigNumber, Contract} from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { toBytes32 } from './utils';

import { expect } from 'chai';
import {NULL_CHARGE, randomAddress} from "./utils/eth";
import {signMetaTxRequest} from "@identity.com/gateway-eth-ts/src/utils/metatx";
import {Forwarder} from "../typechain-types";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

describe('GatewayToken', async () => {
    let signers: SignerWithAddress[];
    let identityCom: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;
    let gatekeeper: SignerWithAddress;
    let gatekeeper2: SignerWithAddress;
    let networkAuthority2: SignerWithAddress;

    let forwarder: Contract;
    let flagsStorage: Contract;
    let gatewayToken: Contract;

    let hexRetailFlag = toBytes32("Retail");
    let hexInstitutionFlag = toBytes32("Institution");
    let hexAccreditedInvestorFlag = toBytes32("AccreditedInvestor");

    let gkn1 = 10;
    let gkn2 = 20;

    before('deploy contracts', async () => {
        [identityCom, alice, bob, carol, gatekeeper, gatekeeper2, networkAuthority2] = await ethers.getSigners();

        const forwarderFactory = await ethers.getContractFactory("Forwarder");
        const flagsStorageFactory = await ethers.getContractFactory("FlagsStorage");
        const gatewayTokenFactory = await ethers.getContractFactory("GatewayToken");

        forwarder = await forwarderFactory.deploy();
        await forwarder.deployed();

        flagsStorage = await flagsStorageFactory.deploy(identityCom.address);
        await flagsStorage.deployed();

        gatewayToken = await gatewayTokenFactory.deploy("Gateway Protocol", "GWY", NULL_ADDRESS, [forwarder.address]);

        // create gatekeeper networks
        await gatewayToken.connect(identityCom).createNetwork(gkn1, 'Test GKN 1', false, NULL_ADDRESS);
        await gatewayToken.connect(identityCom).createNetwork(gkn2, 'Test GKN 2', false, NULL_ADDRESS);
    });

    describe('Test executing functions only for Identity.com admin by third-party address', async () => {
        it('Try to change admin by Bob, expect revert due to invalid access', async () => {
            await expect(
                gatewayToken.connect(bob).setSuperAdmin(bob.address)
            ).to.be.revertedWith("NOT SUPER ADMIN");
        });
    });

    describe('Test FlagsStorage smart contract', async () => {
        it('Try to add new flag by Bob, expect revert due to invalid access', async () => {
            await expect(
                flagsStorage.connect(bob).addFlag(hexRetailFlag, 0)
            ).to.be.revertedWith("NOT SUPER ADMIN");
        });

        it('Successfully add flag by superadmin, expect success', async () => {
            await flagsStorage.connect(identityCom).addFlag(hexRetailFlag, 0);
        });

        it('Successfully add several flags by daoController, expect success', async () => {
            let flagCodes = [hexInstitutionFlag, hexAccreditedInvestorFlag];
            let indexArray = [1, 2];

            await flagsStorage.addFlags(flagCodes, indexArray);
        });

        it('Try to add new flag at already used index, expect revert', async () => {
            await expect(
                flagsStorage.addFlag(hexRetailFlag, 0)
            ).to.be.revertedWith("Index already used");
        });
    });

    describe('Test adding network authorities', async () => {
        it('Successfully add 1 new network authority to gatekeeper network', async () => {
            await gatewayToken.connect(identityCom).addNetworkAuthority(networkAuthority2.address, gkn1);
            expect(
                await gatewayToken.connect(identityCom).isNetworkAuthority(networkAuthority2.address, gkn1)
            ).to.be.true;
        });

        it('Successfully add a gatekeeper after becoming network authority', async () => {
            await gatewayToken.connect(networkAuthority2).addGatekeeper(gatekeeper.address, gkn1);
        });

        it('Expect revert when attempting to issue as a non-gatekeeper network authority', async () => {
            await expect(
                gatewayToken.connect(networkAuthority2).mint(alice.address, gkn1, 0, 0, NULL_CHARGE)
            ).to.be.revertedWith("MUST BE GATEKEEPER");
        });

        it("Try to remove non-existing network authorities, don't expect revert", async () => {
            await gatewayToken.connect(identityCom).removeNetworkAuthority('0x2F60d06Fa6795365B7b42B27Fa23e3e8c8b82f66', gkn1);
        });

        it("Remove a network authority", async () => {
            await gatewayToken.connect(identityCom).removeNetworkAuthority(networkAuthority2.address, gkn1);
        });

        it('Expect revert on adding new network authority by Alice', async () => {
            await expect(
                gatewayToken.connect(alice).addNetworkAuthority(bob.address, gkn1)
            ).to.be.revertedWith(/missing role/);
        });

        it('Expect revert on removing existing network authority by Alice', async () => {
            await expect(
                gatewayToken.connect(alice).removeNetworkAuthority(identityCom.address, gkn1)
            ).to.be.revertedWith(/missing role/);
        });
    });

    describe('Add Gatekeeper', () => {
        it('can add a gatekeeper', async () => {
            await gatewayToken.connect(identityCom).addGatekeeper(gatekeeper.address, gkn1)
            const isGatekeeperResult = await gatewayToken.isGatekeeper(gatekeeper.address, gkn1);

            expect(isGatekeeperResult).to.be.true;
        })

        it('does not add the gatekeeper to other networks', async () => {
            const isGatekeeperResult = await gatewayToken.isGatekeeper(gatekeeper.address, gkn2);

            expect(isGatekeeperResult).to.be.false;
        })
    })

    describe('Test gateway token issuance', async () => {
        it('verified returns false if a token is not yet minted', async () => {
            let verified = await gatewayToken['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(verified).to.be.false;
        });

        it('Successfully mint Gateway Token for Alice by gatekeeper with gatekeeperNetwork = 1', async () => {
            await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, NULL_CHARGE)

            let verified = await gatewayToken['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(verified).to.be.true;
        });

        it('retrieves tokenId', async () => {
            let tokenId = await gatewayToken.tokenOfOwnerByIndex(alice.address, 0);
            expect(tokenId).to.equal(BigNumber.from(1));
            let tokenOwner = await gatewayToken.ownerOf(1);
            expect(tokenOwner).to.equal(alice.address);
        });

        it('Successfully mint Gateway Token for Alice by gatekeeper with gatekeeperNetwork = 2', async () => {
            // add the gatekeeper to network 2
            await gatewayToken.connect(identityCom).addGatekeeper(gatekeeper.address, gkn2)

            await gatewayToken.connect(gatekeeper).mint(alice.address, gkn2, 0, 0, NULL_CHARGE);

            let verified = await gatewayToken['verifyToken(address,uint256)'](alice.address, gkn2);
            expect(verified).to.be.true;
        });

        it('mint a second token for Alice with gatekeeperNetwork = 1', async () => {
            await gatewayToken.connect(gatekeeper).mint(alice.address, gkn1, 0, 0, NULL_CHARGE)

            let verified = await gatewayToken['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(verified).to.be.true;
        });

        it('get all tokens for a user and network', async () => {
            const aliceTokenIdsGKN1 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);
            expect(aliceTokenIdsGKN1.length).to.equal(2);
            expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1[0])).to.equal(alice.address);
            expect(await gatewayToken.ownerOf(aliceTokenIdsGKN1[1])).to.equal(alice.address);
        });

        it("Try to transfer a token, expect revert", async () => {
            await expect(
                gatewayToken.connect(alice)['transferFrom(address,address,uint256)'](alice.address, bob.address, 1)
            ).to.be.revertedWith("TRANSFERS RESTRICTED");
        });

        it("Try to transfer 1st tokenId by Carol while transfers still restricted", async () => {
            await gatewayToken.connect(alice)['approve(address,uint256)'](carol.address, 1)
            await expect(
                gatewayToken.connect(carol)['safeTransferFrom(address,address,uint256)'](alice.address, alice.address, 1)
            ).to.be.revertedWith("TRANSFERS RESTRICTED");
        });
    });

    describe('Test gateway token verification with frozen, active, expired tokens', async () => {
        let aliceTokenIdsGKN1
        let aliceTokenIdsGKN2

        before(async () => {
            aliceTokenIdsGKN1 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);
            aliceTokenIdsGKN2 = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn2);
        });

        it('freeze token', async () => {
            await gatewayToken.connect(gatekeeper).freeze(aliceTokenIdsGKN2[0]);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn2);
            expect(validity[0]).to.equal(false);
        });

        it('unfreeze token', async () => {
            await gatewayToken.connect(gatekeeper).unfreeze(aliceTokenIdsGKN2[0]);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(validity[0]).to.equal(true);
        });

        it('all tokens must be frozen for to verify to return false', async () => {
            await gatewayToken.connect(gatekeeper).freeze(aliceTokenIdsGKN1[0]);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(validity[0]).to.equal(true);

            await gatewayToken.connect(gatekeeper).freeze(aliceTokenIdsGKN1[1]);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(validity[0]).to.equal(false);

            await gatewayToken.connect(gatekeeper).unfreeze(aliceTokenIdsGKN1[0]);

            validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(validity[0]).to.equal(true);
        });

        it('expire token', async () => {
            await gatewayToken.connect(gatekeeper).setExpiration(aliceTokenIdsGKN1[0], Date.parse("2020-01-01") / 1000, NULL_CHARGE);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(validity[0]).to.equal(false);
        });

        it('extend expiry', async () => {
            await gatewayToken.connect(gatekeeper).setExpiration(aliceTokenIdsGKN1[0], Date.parse("2222-01-01") / 1000, NULL_CHARGE);

            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(validity[0]).to.equal(true);
        });

        it('burn', async () => {
            // burn the second token
            await gatewayToken.connect(gatekeeper).burn(aliceTokenIdsGKN1[1]);

            let validity = await gatewayToken.functions['verifyToken(uint256)'](aliceTokenIdsGKN1[1]);
            expect(validity[0]).to.equal(false);

            // alice still has the other token
            let aliceValid = await gatewayToken.functions['verifyToken(address,uint256)'](alice.address, gkn1);
            expect(aliceValid[0]).to.equal(true);
        });
    });

    describe('Bitmask operations', async () => {
        let tokenId;

        before(async () => {
            [tokenId] = await gatewayToken.getTokenIdsByOwnerAndNetwork(alice.address, gkn1);
        });

        it('Test bitmask operations for Alice token', async () => {
            let bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('0');

            const asGatekeeper = gatewayToken.connect(gatekeeper);

            await asGatekeeper.setBitmask(tokenId, 3);

            bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('11');

            await asGatekeeper.addBitmask(tokenId, 4);

            bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('111');

            const tokenState = await gatewayToken.getToken(tokenId);
            expect(tokenState.bitmask.toBigInt().toString(2)).to.equal('111');

            await asGatekeeper.removeBit(tokenId, 1);

            bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('101');

            await asGatekeeper.removeBitmask(tokenId, 5);

            bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('0');

            await asGatekeeper.addBit(tokenId, 2);

            bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('100');

            await asGatekeeper.clearBitmask(tokenId);

            bitmask = await gatewayToken.getTokenBitmask(tokenId);
            expect(bitmask.toBigInt().toString(2)).to.equal('0');
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

        it('Successfully forwards a call', async () => {

            const mintTx = await gatewayToken.connect(gatekeeper).populateTransaction.mint(carol.address, gkn1, 0, 0, NULL_CHARGE);

            // Carol does not have the GT yet
            let validity = await gatewayToken.functions['verifyToken(address,uint256)'](carol.address, gkn1);
            expect(validity[0]).to.equal(false);

            const input = {
                from: gatekeeper.address,
                to: gatewayToken.address,
                data: mintTx.data as string
            };
            const { request, signature } = await signMetaTxRequest(gatekeeper, forwarder as Forwarder, input);

            const forwarderTx = await forwarder.connect(alice).execute(request, signature, { gasLimit: 1000000 });
            const receipt = await forwarderTx.wait();

            expect(receipt.status).to.equal(1);

            // carol now has the GT
            validity = await gatewayToken.functions['verifyToken(address,uint256)'](carol.address, gkn1);
            expect(validity[0]).to.equal(true);
        });
    });
});
