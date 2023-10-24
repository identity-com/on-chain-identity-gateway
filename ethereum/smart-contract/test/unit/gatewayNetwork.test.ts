import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { GatewayNetwork, GatewayNetwork__factory } from '../../typechain-types' ;
import { utils } from 'ethers';

describe('GatewayNetworkToken', async () => {
    let primaryAuthority: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let deployer: SignerWithAddress;

    let gatekeeperNetworkContract: GatewayNetwork;

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const getDefaultNetwork = (primaryAuthority: string, gatekeepers?: string[]): GatewayNetwork.GatekeeperNetworkDataStruct => {
        return {
            primaryAuthority,
            name: utils.formatBytes32String('default'),
            passExpireTimeInSeconds: 1000,
            networkFeatures: 0,
            networkFees: [{tokenAddress: ZERO_ADDRESS, issueFee: 0, refreshFee: 0, expireFee: 0}],
            supportedTokens: [ZERO_ADDRESS],
            gatekeepers: gatekeepers ? gatekeepers : []
        }
    }

    beforeEach('setup', async () => {
        [deployer, primaryAuthority, alice, bob] = await ethers.getSigners();

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

            expect(network.name).to.equal(defaultNetwork.name);
            expect(network.primaryAuthority).to.equal(primaryAuthority.address);
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

        beforeEach('create network', async () => {
            const defaultNetwork = getDefaultNetwork(primaryAuthority.address, []);
            await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});
        });

        it('can update the primary authority of a network if called by the current primary authority', async () => {
            const updatedNetwork = getDefaultNetwork(alice.address, []);
            await gatekeeperNetworkContract.connect(primaryAuthority).updateNetwork(0, updatedNetwork, {gasLimit: 300000});

            const network = await gatekeeperNetworkContract._networks(updatedNetwork.name);

            expect(network.primaryAuthority).to.equal(alice.address);
        });
        it('can update the pass expire time if called by primary authority', async () => {

        });
        it('can update supported tokens if called by primary authority', async () => {

        });
        it('can update gatekeepers if called by primary authority', async () => {

        });
        it('cannot update the primary authority of a network', async () => {

        });
        it('cannot update network if it does not exist', async () => {

        });
        it('cannot update the primary authority of a network to zero address', async () => {

        });
        it('cannot the pass expire time', async () => {

        });
        it('cannot update supported tokens', async () => {

        });
        it('cannot update gatekeepers', async () => {

        });
        it('cannot make unsupported updates to a network', async () => {

        });

    })

    describe('Gatekeeper Network Deletion', async () => {
        it('can delete a network', async () => {

        });

        it('cannot delete a network that does not exist', async () => {

        });

        it('cannot delete a network with gatekeepers', async () => {

        });
    })
})