import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;  
    const { deployer } = await getNamedAccounts();

    // Deploy two forwarders, the basic forwarder (which is the default one)
    // and the flexible nonce forwarder.
    await deploy("Forwarder", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: true
    });

    // This should be configurable per chain.
    // 10_000 blocks on Polygon is ~8 hours (@3s per block)
    // 10_000 blocks on Ethereum is ~40 hours (@15s per block)
    const blockAgeTolerance = 100;
    await deploy("FlexibleNonceForwarder", {
        from: deployer,
        args: [blockAgeTolerance],
        log: true,
        deterministicDeployment: true
    });
};

export default func;
func.id = 'deploy_forwarder';
func.tags = ['Forwarder'];