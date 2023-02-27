import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {deployProxyCreate2} from "../scripts/util";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, ethers, deployments } = hre;
  const { deployer } = await getNamedAccounts();

  const hexRetailFlag = ethers.utils.formatBytes32String("Retail");
  const hexInstitutionFlag = ethers.utils.formatBytes32String("Institution");
  const hexAccreditedInvestorFlag = ethers.utils.formatBytes32String("AccreditedInvestor");
  const flagCodes = [hexRetailFlag, hexInstitutionFlag, hexAccreditedInvestorFlag];
  const indexArray = [0, 1, 2];

  const flagsStorageContract = await deployProxyCreate2(hre, 'FlagsStorage', [deployer]);

  // call addFlags function against the proxy
  const flagsAdded = await Promise.all(
      flagCodes.map(flagCode => flagsStorageContract.isFlagSupported(flagCode))
  );

  if (!flagsAdded.every((flag) => flag)) {
    let tx = await (await flagsStorageContract.addFlags(flagCodes, indexArray, {from: deployer})).wait();
    console.log("Added " + tx.events.length +  " flags into FlagsStorage with " + tx.gasUsed.toNumber() + " gas");
  } else {
    console.log("Flags already added.");
  }
};

export default func;
func.id = 'deploy_flags_storage';
func.tags = ['FlagsStorage'];