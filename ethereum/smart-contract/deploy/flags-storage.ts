import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;  
  const { deployer } = await getNamedAccounts();

  const hexRetailFlag = ethers.utils.formatBytes32String("Retail");
  const hexInstitutionFlag = ethers.utils.formatBytes32String("Institution");
  const hexAccreditedInvestorFlag = ethers.utils.formatBytes32String("AccreditedInvestor");
  const flagCodes = [hexRetailFlag, hexInstitutionFlag, hexAccreditedInvestorFlag];
  const indexArray = [0, 1, 2];

  const { address } = await deploy('FlagsStorage', {
    from: deployer,
    args: [deployer],
    log: true,
  });

  const flagsStorageContract = await ethers.getContractAt(
    'FlagsStorage',
    address,
  );
  
  let tx = await (await flagsStorageContract.addFlags(flagCodes, indexArray, {from: deployer})).wait();
  console.log("Added " + tx.events.length +  " flags into FlagsStorage with " + tx.gasUsed.toNumber() + " gas");
};

export default func;
func.id = 'deploy_flags_storage';
func.tags = ['FlagsStorage'];  