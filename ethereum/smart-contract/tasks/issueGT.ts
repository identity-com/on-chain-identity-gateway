import {HardhatRuntimeEnvironment} from "hardhat/types";
import {BigNumber, BytesLike, utils, Wallet} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
const { abi } = require("../build/contracts/GatewayToken.sol/GatewayToken.json");

export const issueGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const {ethers} = hre;

  const [owner, payer] = await hre.ethers.getSigners();
  const gatekeeper: Wallet | SignerWithAddress = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, owner.provider) : owner;
  const gatekeeperNetwork = ethers.utils.getAddress(args.gatekeepernetwork);

  const account = ethers.utils.getAddress(args.address);

  const gatewayToken = new ethers.Contract(gatekeeperNetwork, abi, owner);
  const hasToken = await gatewayToken.balanceOf(account)
  console.log({hasToken});
  
  const mintTx = await gatewayToken.populateTransaction.mint(account, account);
  
  if (!mintTx.data) throw new Error('No data output from the transaction creation step');
  
  let transactionReceipt;
  
  // if (!args.forwarded) {
    transactionReceipt = await owner.sendTransaction(mintTx)
  // } else {
    // console.log("Forwarding with " + forwarder.address);
    // const { request, signature } = await signMetaTxRequest(owner, forwarder, {
    //   from: owner.address,
    //   to: gatewayToken.address,
    //   data: mintTx.data
    // });
    //
    // const unsignedTx = await forwarder.populateTransaction.execute(request, signature);
    //
    // transactionReceipt = await owner.sendTransaction(unsignedTx);

  // }
  console.log(transactionReceipt);
  
  await transactionReceipt.wait();
}