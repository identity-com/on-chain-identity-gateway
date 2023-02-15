import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DEFAULT_GATEWAY_TOKEN_ADDRESS} from "../../gateway-eth-ts/src";

export const checkGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  
  const account = ethers.utils.getAddress(args.address);

  const contract = await ethers.getContractAt(
    'GatewayToken',
    DEFAULT_GATEWAY_TOKEN_ADDRESS,
  );

  const result = await contract['verifyToken(address,uint256)'](account, args.gatekeepernetwork);

  const result2 = await contract['getTokenIdsByOwnerAndNetwork(address,uint256)'](account, args.gatekeepernetwork);
  
  console.log({result, result2});
}