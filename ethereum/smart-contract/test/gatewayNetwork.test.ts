import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { GatewayNetwork, GatewayNetwork__factory, IGatewayNetwork } from '../typechain-types' ;
import { utils } from 'ethers';

describe('GatewayNetwork', () => {
    let primaryAuthority: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let deployer: SignerWithAddress;
    let stableCoin: SignerWithAddress;

    let gatekeeperNetworkContract: GatewayNetwork;

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const DEFAULT_PASS_EXPIRE_TIMESTAMP = Date.now() + 100000000;

    const getDefaultNetwork = (primaryAuthority: string, gatekeepers?: string[], passExpireTimestamp?: number): IGatewayNetwork.GatekeeperNetworkDataStruct => {
        return {
            primaryAuthority,
            name: utils.formatBytes32String('default'),
            passExpireTimestamp: passExpireTimestamp ? passExpireTimestamp : DEFAULT_PASS_EXPIRE_TIMESTAMP,
            networkFeatures: 0,
            networkFees: [{tokenAddress: ZERO_ADDRESS, issueFee: 0, refreshFee: 0, expireFee: 0}],
            supportedToken: ZERO_ADDRESS,
            gatekeepers: gatekeepers ? gatekeepers : []
        }
    }

    beforeEach('setup', async () => {
        [deployer, primaryAuthority, alice, bob, stableCoin] = await ethers.getSigners();

        const gatewayNetworkFactory = await new GatewayNetwork__factory(deployer);

        gatekeeperNetworkContract = await gatewayNetworkFactory.deploy();
        await gatekeeperNetworkContract.deployed();
    })


    describe('Gatekeeper Network Creation', async () => {
        it('creates a new network with a primary authority', async () => {
            const defaultNetwork = getDefaultNetwork(primaryAuthority.address, []);
            await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});

            const network = await gatekeeperNetworkContract._networks(defaultNetwork.name);
            const isGatekeeper = await gatekeeperNetworkContract.isGateKeeper(defaultNetwork.name, deployer.address);
            const supportedToken = await gatekeeperNetworkContract.getSupportedToken(defaultNetwork.name);

            expect(network.name).to.equal(defaultNetwork.name);
            expect(network.primaryAuthority).to.equal(primaryAuthority.address);
            expect(network.supportedToken).to.equal(supportedToken);
            expect(isGatekeeper).to.be.false;
        });

        it('creates a new network with gatekeepers', async () => {
            const defaultNetwork = getDefaultNetwork(primaryAuthority.address, [alice.address]);
            await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});

            const isGatekeeper = await gatekeeperNetworkContract.isGateKeeper(defaultNetwork.name, alice.address);

            expect(isGatekeeper).to.be.true;
        });
        it('cannot create a new network zero address primary authority', async () => {
            const defaultNetwork = getDefaultNetwork(ZERO_ADDRESS, []);
            await expect(gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000})).to.be.rejectedWith('Network primary authority cannot be zero address');
        });
        it('cannot create a new network with no name', async () => {
            const defaultNetwork = getDefaultNetwork(ZERO_ADDRESS, []);
            defaultNetwork.name = utils.formatBytes32String('');

            await expect(gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000})).to.be.rejectedWith('Network name cannot be an empty string');
        });
        it('cannot create a new network with a network name that already exist', async () => {
            const defaultNetwork = getDefaultNetwork(primaryAuthority.address, [alice.address]);
            await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});

            await expect(gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000})).to.be.revertedWithCustomError(gatekeeperNetworkContract, 'GatewayNetworkAlreadyExists');
        });
    })

    describe('Gatekeeper Network Update', async () => {
        let  defaultNetwork: IGatewayNetwork.GatekeeperNetworkDataStruct;

        beforeEach('create network', async () => {
            defaultNetwork = getDefaultNetwork(primaryAuthority.address, []);
            await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});
        });

        it('can update the primary authority of a network if called by the current primary authority', async () => {
            await gatekeeperNetworkContract.connect(primaryAuthority).updatePrimaryAuthority(alice.address, defaultNetwork.name, {gasLimit: 300000});
            await gatekeeperNetworkContract.connect(alice).claimPrimaryAuthority(defaultNetwork.name);
            const network = await gatekeeperNetworkContract._networks(defaultNetwork.name);

            expect(network.primaryAuthority).to.equal(alice.address);
        });
        it('can update the pass expire timestamp if called by primary authority', async () => {
            // given
            const network = await gatekeeperNetworkContract._networks(defaultNetwork.name);
            expect(network.passExpireTimestamp).to.be.eq(DEFAULT_PASS_EXPIRE_TIMESTAMP);

            const newTimestamp = DEFAULT_PASS_EXPIRE_TIMESTAMP + 1000;

            //when
            await gatekeeperNetworkContract.connect(primaryAuthority).updatePassExpirationTimestamp(newTimestamp, defaultNetwork.name, {gasLimit: 300000});

            //then
            const resolvedUpdatedNetwork = await gatekeeperNetworkContract._networks(defaultNetwork.name);
            expect(resolvedUpdatedNetwork.passExpireTimestamp).to.be.eq(newTimestamp);
        });

        it('can add a gatekeeper if called by primary authority', async () => {
            // given
            const newGatekeeper = bob.address;

            const currentGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(currentGatekeepers.length).to.be.eq(0);

            //when
            await gatekeeperNetworkContract.connect(primaryAuthority).addGatekeeper(newGatekeeper, defaultNetwork.name, {gasLimit: 300000});

            //then
            const newGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(newGatekeepers.length).to.be.eq(1);
            expect(newGatekeepers[0]).to.be.eq(bob.address);
        });
        it('can remove a gatekeeper if called by primary authority', async () => {
            // given
            const newGatekeeper = bob.address;

            const currentGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(currentGatekeepers.length).to.be.eq(0);

            await gatekeeperNetworkContract.connect(primaryAuthority).addGatekeeper(newGatekeeper, defaultNetwork.name, {gasLimit: 300000});

            const newGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(newGatekeepers.length).to.be.eq(1);
            expect(newGatekeepers[0]).to.be.eq(bob.address);

            //when
            await gatekeeperNetworkContract.connect(primaryAuthority).removeGatekeeper(newGatekeeper, defaultNetwork.name, {gasLimit: 300000});
        
            //then
            const finalGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(finalGatekeepers.length).to.be.eq(0);
        });

        it('can retreive the id of a network', async () => {
            //given
            const networkId = ethers.utils.hexZeroPad(defaultNetwork.name.toString(), 32);

            //when
            const resolvedNetworkId = await gatekeeperNetworkContract.getNetworkId(defaultNetwork.name);

            //then
            expect(ethers.utils.hexZeroPad(resolvedNetworkId.toHexString(), 32)).to.eq(networkId);
        });

        it('can check if a network exist', async () => {
            // when
            const result = await gatekeeperNetworkContract.doesNetworkExist(ethers.utils.hexZeroPad(defaultNetwork.name.toString(), 32));

            //then
            expect(result).to.be.true;
        });
        it('cannot update the primary authority of a network if not current primary authority', async () => {
            await expect(gatekeeperNetworkContract.connect(alice).updatePrimaryAuthority(alice.address, defaultNetwork.name, {gasLimit: 300000})).to.be.rejectedWith("Only the primary authority can perform this action");
        });
        it('cannot update network if it does not exist', async () => {
            const name = utils.formatBytes32String('not-default-name');
            await expect(gatekeeperNetworkContract.connect(primaryAuthority).addGatekeeper(alice.address, name, {gasLimit: 300000})).to.be.rejectedWith("Network does not exist");
        });
        it('cannot update the primary authority of a network to zero address', async () => {
            await expect(gatekeeperNetworkContract.connect(primaryAuthority).updatePrimaryAuthority(ZERO_ADDRESS, defaultNetwork.name, {gasLimit: 300000})).to.be.rejectedWith("Primary authority cannot be set to the zero address");
        });
        it('cannot update the pass expire time if not primary authority', async () => {
            // given
            const newTimestamp = DEFAULT_PASS_EXPIRE_TIMESTAMP + 1000;

            // when
            await expect(gatekeeperNetworkContract.connect(alice).updatePassExpirationTimestamp(newTimestamp, defaultNetwork.name, {gasLimit: 300000})).to.be.rejectedWith("Only the primary authority can perform this action");
        });

        it('cannot add a gatekeeper if not primary authority', async () => {
            await expect(gatekeeperNetworkContract.connect(bob).addGatekeeper(bob.address, defaultNetwork.name, {gasLimit: 300000})).to.be.rejectedWith("Only the primary authority can perform this action");
        });
        it('cannot remove a gatekeeper if not primary authority', async () => {
            // given
            const newGatekeeper = bob.address;

            const currentGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(currentGatekeepers.length).to.be.eq(0);

            await gatekeeperNetworkContract.connect(primaryAuthority).addGatekeeper(newGatekeeper, defaultNetwork.name, {gasLimit: 300000});

            const newGatekeepers = await gatekeeperNetworkContract.gatekeepersOnNetwork(defaultNetwork.name);
            expect(newGatekeepers.length).to.be.eq(1);
            expect(newGatekeepers[0]).to.be.eq(bob.address);

            // then
            await expect(gatekeeperNetworkContract.connect(bob).removeGatekeeper(newGatekeeper, defaultNetwork.name, {gasLimit: 300000})).to.be.rejectedWith("Only the primary authority can perform this action");
        });

    })

    describe('Gatekeeper Network Deletion', async () => {
        let  defaultNetwork: IGatewayNetwork.GatekeeperNetworkDataStruct;

        beforeEach('create network', async () => {
            defaultNetwork = getDefaultNetwork(primaryAuthority.address, []);
            await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});
        });

        it('can delete a network', async () => {
            //given
            const existingNetwork = getDefaultNetwork(primaryAuthority.address);
            const network = await gatekeeperNetworkContract._networks(existingNetwork.name);
            expect(network.name).to.equal(existingNetwork.name);

            //when
            await gatekeeperNetworkContract.connect(primaryAuthority).closeNetwork(existingNetwork.name);

            //then
            const resolvedNetwork = await gatekeeperNetworkContract._networks(existingNetwork.name);
            expect(resolvedNetwork.primaryAuthority).to.equal(ZERO_ADDRESS);
        });

        it('cannot delete a network that does not exist', async () => {
            await expect(gatekeeperNetworkContract.connect(primaryAuthority).closeNetwork(utils.formatBytes32String('non-real-network'))).to.be.revertedWith("Network does not exist");
        });

        it('cannot delete a network with gatekeepers', async () => {
            // given
            const newGatekeeper = bob.address;

            // Add gatekeepers to network
            await gatekeeperNetworkContract.connect(primaryAuthority).addGatekeeper(newGatekeeper, defaultNetwork.name, {gasLimit: 300000});

            //when
            await expect(gatekeeperNetworkContract.connect(primaryAuthority).closeNetwork(defaultNetwork.name)).to.be.revertedWith("Network can only be removed if no gatekeepers are in it");
        });
    })
})