import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';
import { ethers } from 'hardhat';
import { IFlagsStorage, IFlagsStorage__factory } from '../typechain-types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deployer } = await getNamedAccounts();

  const hexRetailFlag = ethers.encodeBytes32String('Retail');
  const hexInstitutionFlag = ethers.encodeBytes32String('Institution');
  const hexAccreditedInvestorFlag = ethers.encodeBytes32String('AccreditedInvestor');
  const flagCodes = [hexRetailFlag, hexInstitutionFlag, hexAccreditedInvestorFlag];
  const indexArray = [0, 1, 2];

  // use the old proxy contract to retain the correct Create2 Address
  const flagsStorageContract = await deployProxyCreate2(hre, 'FlagsStorage', [deployer],
      IFlagsStorage__factory.connect,
      false);

  // call addFlags function against the proxy
  const flagsAdded = await Promise.all(flagCodes.map((flagCode) => flagsStorageContract.isFlagSupported(flagCode)));

  if (!flagsAdded.every((flag) => flag)) {
    let tx = await (await flagsStorageContract.addFlags(flagCodes, indexArray, { from: deployer })).wait();
    const events = tx?.logs.length
    console.log(`Added ${events} flags into FlagsStorage with ${tx?.gasUsed.toString()} gas`);
  } else {
    console.log('Flags already added.');
  }
};

export default func;
func.id = 'deploy_flags_storage';
func.tags = ['FlagsStorage'];
