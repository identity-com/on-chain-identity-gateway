import {HardhatRuntimeEnvironment} from "hardhat/types";
import {BigNumber, BytesLike, utils, Wallet} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {DEFAULT_FORWARDER_ADDRESS, DEFAULT_GATEWAY_TOKEN_ADDRESS} from "@identity.com/gateway-eth-ts";
import {NULL_CHARGE} from "../test/utils/eth";
import {signMetaTxRequest} from "@identity.com/gateway-eth-ts/src/utils/metatx";
import {Forwarder} from "../typechain-types";

export const issueGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;

  const [owner] = await ethers.getSigners();
  const gatekeeper: Wallet | SignerWithAddress = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, owner.provider) : owner;
  const gatekeeperNetwork = BigInt(args.gatekeepernetwork);

  const account = ethers.utils.getAddress(args.address);

  const contract = await ethers.getContractAt(
      'GatewayToken',
      DEFAULT_GATEWAY_TOKEN_ADDRESS,
  );

  const hasToken = await contract['verifyToken(address,uint256)'](account, args.gatekeepernetwork);
  console.log({hasToken});
  
  const mintTx = await contract.connect(gatekeeper).populateTransaction.mint(account, gatekeeperNetwork, 0, 0, NULL_CHARGE);
  
  if (!mintTx.data) throw new Error('No data output from the transaction creation step');
  
  let transactionReceipt;
  
  if (!args.forwarded) {
    transactionReceipt = await gatekeeper.sendTransaction(mintTx)
  } else {
    const forwarder = (await ethers.getContractAt(
        'Forwarder',
        DEFAULT_FORWARDER_ADDRESS,
    )).connect(gatekeeper);

    const { request, signature } = await signMetaTxRequest(gatekeeper, forwarder as Forwarder, {
      from: gatekeeper.address,
      to: DEFAULT_GATEWAY_TOKEN_ADDRESS,
      data: mintTx.data
    });

    const unsignedTx = await forwarder.populateTransaction.execute(request, signature);

    transactionReceipt = await owner.sendTransaction(unsignedTx);

  }
  console.log(transactionReceipt);
  
  await transactionReceipt.wait();
}