import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import {ChargeHandler__factory, GatewayToken__factory, IGatewayToken__factory } from '../typechain-types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  const flagsStorage = await deployments.get('FlagsStorageProxy');
  const chargeHandler = await deployments.get('ChargeHandlerProxy');

  const args = ['Gateway Protocol', 'PASS', deployer, flagsStorage.address, chargeHandler.address, []];
  const gatewayTokenContract = await deployProxyCreate2(hre, 'GatewayToken', args, GatewayToken__factory.connect);

  // set the gateway token contract as the owner of the chargeHandler
  const chargeHandlerContract = ChargeHandler__factory.connect(chargeHandler.address, deployerSigner);

  console.log('deployer: ' + deployer);
  const gatewayTokenAddress = await gatewayTokenContract.getAddress();
  await chargeHandlerContract.setRole(keccak256(toUtf8Bytes('CHARGE_CALLER_ROLE')), gatewayTokenAddress);

  console.log('Adding charge handler to gateway token');
  await gatewayTokenContract.updateChargeHandler(chargeHandler.address);

  console.log('deployed GatewayToken at ' + gatewayTokenAddress);
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['FlagsStorage', 'ChargeHandler'];
