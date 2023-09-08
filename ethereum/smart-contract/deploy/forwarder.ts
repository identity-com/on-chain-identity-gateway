import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  // This should be configurable per chain.
  // 10_000 blocks on Polygon is ~8 hours (@3s per block)
  // 10_000 blocks on Ethereum is ~40 hours (@15s per block)
  const blockAgeTolerance = 100;
  const flexibleNonceForwarderDeployment = await deploy('FlexibleNonceForwarder', {
    from: deployer,
    args: [blockAgeTolerance],
    log: true,
    deterministicDeployment: true,
  });

  const gatewayToken = await deployments.get('GatewayTokenProxy');
  const token = (await ethers.getContractAt('GatewayToken', gatewayToken.address)).connect(deployerSigner);
  const addForwarderTx = await (await token.addForwarder(flexibleNonceForwarderDeployment.address)).wait();
  console.log(
    'Added flexible nonce forwarder ' +
      flexibleNonceForwarderDeployment.address +
      ' on Gateway Token at ' +
      gatewayToken.address +
      ' using ' +
      addForwarderTx.gasUsed.toNumber() +
      ' gas',
  );
};

export default func;
func.id = 'deploy_forwarder';
func.tags = ['Forwarder'];
// func.dependencies = ['GatewayToken'];
