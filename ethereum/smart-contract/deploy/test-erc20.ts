import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const erc20Deployment = await deploy('DummyERC20', {
    from: deployer,
    args: ['Dummy USDC', 'USDC', 1000000, deployer],
    log: true,
    deterministicDeployment: true,
  });

  console.log('Deployed DummyERC20 at ' + erc20Deployment.address);
};

export default func;
func.skip = async () => process.env.NODE_ENV !== 'test';
func.id = 'create_dummy_erc20';
func.tags = ['DummyERC20'];
func.dependencies = [];
