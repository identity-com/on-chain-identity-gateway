import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { GatewayNetwork, GatewayNetwork__factory, IGatewayNetwork, Gatekeeper, Gatekeeper__factory, IGatewayGatekeeper } from '../typechain-types' ;
import { utils } from 'ethers';

describe('Gatekeeper Test', () => {
    let primaryAuthority: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let deployer: SignerWithAddress;
    let stableCoin: SignerWithAddress;

    let gatekeeperNetworkContract: GatewayNetwork;
    let gatekeeperContract: Gatekeeper;

    let  defaultNetwork: IGatewayNetwork.GatekeeperNetworkDataStruct;

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const DEFAULT_PASS_EXPIRE_TIMESTAMP = Date.now() + 100000000;

    const getDefaultNetwork = (primaryAuthority: string, gatekeepers?: string[], passExpireTimestamp?: number): IGatewayNetwork.GatekeeperNetworkDataStruct => {
        return {
            primaryAuthority,
            name: utils.formatBytes32String('default'),
            passExpireTimestamp: passExpireTimestamp ? passExpireTimestamp : DEFAULT_PASS_EXPIRE_TIMESTAMP,
            networkFeatureMask: 0,
            networkFees: [{tokenAddress: ZERO_ADDRESS, issueFee: 0, refreshFee: 0, expireFee: 0}],
            supportedToken: ZERO_ADDRESS,
            gatekeepers: gatekeepers ? gatekeepers : []
        }
    }

    before('setup', async () => {
        [deployer, primaryAuthority, alice, bob, stableCoin] = await ethers.getSigners();

        const gatewayNetworkFactory = await new GatewayNetwork__factory(deployer);
        const gatekeeperContractFactory = await new Gatekeeper__factory(deployer);

        gatekeeperContract = await gatekeeperContractFactory.deploy();
        gatekeeperNetworkContract = await gatewayNetworkFactory.deploy(gatekeeperContract.address);
        await gatekeeperNetworkContract.deployed();

        defaultNetwork = getDefaultNetwork(primaryAuthority.address, []);
        await gatekeeperNetworkContract.connect(deployer).createNetwork(defaultNetwork, {gasLimit: 300000});
    })

    describe('Contract initialization', async () => {

    })

    describe('Gatekeeper Creation', async () => {

    })


    describe('Gatekeeper Updates', async () => {

    })

    describe('Gatekeeper Removal', async () => {
       
    })
})