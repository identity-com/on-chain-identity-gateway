import {HardhatRuntimeEnvironment} from "hardhat/types";
import ERC1967Proxy from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import {getInitializerData} from "@openzeppelin/hardhat-upgrades/dist/utils";


// A bug in hardhat leads to undefined entries in the accounts if any are duplicates.
// This function normalises this by creating defaults for each one
export const getAccounts = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts } = hre;
    const {deployer, authority, gatekeeper} = await getNamedAccounts();
    return {
        deployer,
        authority: authority || deployer,
        gatekeeper: gatekeeper || deployer,
    }
}
export const deployProxy = async (hre: HardhatRuntimeEnvironment, contractName: string, args: any[], reuseDeployments = true, opts: any = {}) => {
    const { deployments, ethers, upgrades } = hre;
    const {save } = deployments;

    const Contract = await ethers.getContractFactory(contractName);

    const existingDeployment = await deployments.getOrNull(contractName);
    if (existingDeployment && reuseDeployments) {
        console.log(`Deploy ${contractName} proxy skipped - reusing existing deployment at ${existingDeployment.address}`);
        return ethers.getContractAt(
            contractName,
            existingDeployment.address,
        );
    }
    
    const proxy = await upgrades.deployProxy(Contract, args, { kind: 'uups', ...opts });
    await proxy.deployed();
    console.log(`Deploy ${contractName} Proxy done -> ${proxy.address}`);

    // Integration between hardhat-deploy and hardhat-upgrades inspired by
    // https://github.com/wighawag/hardhat-deploy/issues/242#issuecomment-998790266
    // // TODO Do we need this?
    // const impl = await upgrades.upgradeProxy(proxy, Contract, opts);
    // console.log(`Deploy ${contractName} Impl  done -> ${impl.address}`);
    const artifact = await deployments.getExtendedArtifact(contractName);
    const proxyDeployments = {
        address: proxy.address,
        ...artifact
    }
    await save(contractName, proxyDeployments);

    return ethers.getContractAt(
        contractName,
        proxy.address,
    );
}

export const deployProxyCreate2 = async (hre: HardhatRuntimeEnvironment, contractName: string, args: any[]) => {
    const { getNamedAccounts, deployments, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const proxyContractName = contractName + "Proxy";

    const impl = await deploy(contractName, {
        from: deployer,
        args: [],   // the implementation takes no arguments, as the constructor must be empty for upgradeable contracts
        log: true,
        deterministicDeployment: true,
    });

    const Contract = await ethers.getContractFactory(contractName);
    const data = getInitializerData(Contract.interface, args);
    const proxy = await deploy(proxyContractName, {
        from: deployer,
        args: [impl.address, data],
        log: true,
        deterministicDeployment: true,
        contract: ERC1967Proxy
    });

    return ethers.getContractAt(
        contractName,
        proxy.address,
    );
}