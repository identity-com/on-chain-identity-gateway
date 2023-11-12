import { DeployFunction } from 'hardhat-deploy/types';

// An empty deploy function combining all dependencies needed for running the gateway-eth tests

const func: DeployFunction = async () => {};

export default func;
func.skip = async () => process.env.NODE_ENV !== 'test';
func.id = 'test_setup';
func.tags = ['TestSetup'];
func.dependencies = ['DummyERC20','BaseGatekeeperNetworks'];
