import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import {keccak256} from "@ethersproject/keccak256";
import {toUtf8Bytes} from "@ethersproject/strings";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, upgrades } = hre;
  const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');
  const deployedGatewayToken = await deployments.get('GatewayTokenProxy');
  const chargeHandler = await deployments.get('ChargeHandlerProxy');

  // upgrade the gateway token
  await upgrades.upgradeProxy(deployedGatewayToken, gatewayTokenFactory);

  console.log("Upgraded - waiting 30s");
  await new Promise((resolve) => setTimeout(resolve, 30_000));
  console.log("Setting charge handler");

  // set the charge handler address
  const gatewayTokenContract = await ethers.getContractAt('GatewayToken', deployedGatewayToken.address);
  await gatewayTokenContract.updateChargeHandler(chargeHandler.address);

  const chargeHandlerContract = await ethers.getContractAt('ChargeHandler', chargeHandler.address);
  await chargeHandlerContract.setRole(keccak256(toUtf8Bytes('CHARGE_CALLER_ROLE')), deployedGatewayToken.address);

  console.log('upgraded GatewayToken at ' + deployedGatewayToken.address);
};

export default func;
func.id = 'upgrade_v2';
func.tags = ['UpgradeV2'];
func.dependencies = ['ChargeHandler'];
