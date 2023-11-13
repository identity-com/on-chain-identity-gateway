import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getAccounts } from '../scripts/util';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

/**
 * Deploy the base set of gatekeeper networks.
 */

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const networks = {
  prod: {
    ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6: 4,
    bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw: 6,
    uniqobk8oGh4XBLMqM68K8M2zNu3CdYX7q5go7whQiv: 10,
    vaa1QRNEBb1G2XjPohqGWnPsvxWnwwXF67pdjrhDSwM: 11,
  },
  dev: {
    tigoYhp9SpCDoCQmXGj2im5xa3mnjR1zuXrpCJ5ZRmi: 14,
    tbniJdS9j7BWhUoJesjpqutC54AYr96cn2No7dJcqce: 16,
    tunQheuPpHhjjsbrUDp4rikqYez9UXv4SXLRHf9Kzsv: 20,
    tvaaHL9BSgZGLRAqUrx1Fzs2Uneb6BWGdnYuqrFoXm3: 21,
  },
};

const addToNetwork = async (
  networkName: string,
  deployer: SignerWithAddress,
  gatekeeper: string,
  contract: Contract,
  slotId: number,
) => {
  console.log('Creating NETWORK: ' + networkName + ' with slotId: ' + slotId + ' and gatekeeper: ' + gatekeeper);
  if (await contract.getNetwork(slotId)) {
    console.log('network ' + slotId + ' already exists');
  } else {
    const createNetworkTx = await (await contract.createNetwork(slotId, networkName, false, NULL_ADDRESS)).wait();
    console.log(
      'created network ' +
        networkName +
        ' (' +
        slotId +
        ') on Gateway Token at ' +
        contract.address +
        ' using ' +
        createNetworkTx.gasUsed.toNumber() +
        ' gas',
    );
  }

  const addGatekeeperTx = await (await contract.addGatekeeper(gatekeeper, slotId)).wait();
  console.log(
    'added new gatekeeper with ' +
      gatekeeper +
      ' address into Gateway Token at ' +
      contract.address +
      ' using ' +
      addGatekeeperTx.gasUsed.toNumber() +
      ' gas',
  );
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;

  const prodGatekeeper = '0x964617b2d933c6e5c6c1B30681DCAee23Baa9836';
  const devGatekeeper = '0x3Afb27942b60d9D4319557A0f3363DC3dA0645B6';

  // WARNING! If any of the below keys are the same as each other
  // hardhat does not resolve them properly. Check by deploying to localhost that they are correct first
  // yarn local --no-deploy &
  // yarn deploy localhost
  let { deployer } = await getAccounts(hre);

  const deployerSigner = await ethers.getSigner(deployer);

  const gatewayToken = await deployments.get('GatewayTokenProxy');
  const token = (await ethers.getContractAt('GatewayToken', gatewayToken.address)).connect(deployerSigner);

  for (const [address, slotId] of Object.entries(networks.prod)) {
    await addToNetwork(address, deployerSigner, prodGatekeeper, token, slotId);
  }
  for (const [address, slotId] of Object.entries(networks.dev)) {
    await addToNetwork(address, deployerSigner, devGatekeeper, token, slotId);
  }
};

export default func;
func.skip = async () => process.env.NODE_ENV === 'test';
func.id = 'create_base_gatekeeper_networks';
func.tags = ['BaseGatekeeperNetworks'];
func.dependencies = ['TestGatekeeperNetwork'];
