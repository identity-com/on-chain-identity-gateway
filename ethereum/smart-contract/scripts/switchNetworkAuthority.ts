// A hardhat script that switches the network authority for a gatekeeper network
import hre from 'hardhat';

(async () => {
  const { ethers, deployments } = hre;
  const [newNetworkAuthority, oldNetworkAuthority] = await ethers.getSigners();

  const gatekeeperNetwork = parseInt(process.env.GKN || '1', 10);
  const gatewayToken = await deployments.get('GatewayTokenProxy');
  const contract = await ethers.getContractAt('GatewayToken', gatewayToken.address);

  const isAuthority = await contract.isNetworkAuthority(oldNetworkAuthority.address, gatekeeperNetwork);
  console.log(`Is ${oldNetworkAuthority.address} an authority on ${gatekeeperNetwork}?`, isAuthority);

  if (!isAuthority) return;

  let txReceipt = await contract
    .connect(oldNetworkAuthority)
    .addNetworkAuthority(newNetworkAuthority.address, gatekeeperNetwork);
  let tx = await txReceipt.wait();
  console.log(
    `Added ${newNetworkAuthority.address} to network ${gatekeeperNetwork} using ${tx.gasUsed.toNumber()} gas`,
  );

  txReceipt = await contract
    .connect(newNetworkAuthority)
    .removeNetworkAuthority(oldNetworkAuthority.address, gatekeeperNetwork);
  tx = await txReceipt.wait();
  console.log(
    `Removed ${oldNetworkAuthority.address} from network ${gatekeeperNetwork} using ${tx.gasUsed.toNumber()} gas`,
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
