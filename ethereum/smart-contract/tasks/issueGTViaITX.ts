import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ITXClient} from "./utils/itx";
import {signMetaTxRequest} from "./utils/signer";


export const issueGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const [owner] = await hre.ethers.getSigners();
    const gatekeeper = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY): owner;
    const account = ethers.utils.getAddress(args.address);

    console.log("gatekeeper", gatekeeper.address);

    const itx = new ITXClient(hre, gatekeeper);

    console.log("ITX balance " + (await itx.getBalance()));

    const gatewayToken = await ethers.getContractAt(
        'GatewayToken',
        '0x43760eeb3E970DCCa101fd08D7FAa89aFacc3B5d',
    );

    const forwarder = await ethers.getContractAt(
        'Forwarder',
        '0x8E80e54894Efb82367B73E7eb01522a89D87F2cE',
    );

    // const { gatewayToken, forwarder } = await loadGatewayContracts(hre);
    const hasToken = await gatewayToken.balanceOf(account)
    console.log({hasToken});

    const mintTx = await gatewayToken.populateTransaction.mint(account, account, 0, 0);
    if (!mintTx.data) throw new Error('No data output from the transaction creation step');

    const { request, signature } = await signMetaTxRequest(owner, forwarder, {
        from: owner.address,
        to: gatewayToken.address,
        data: mintTx.data
    });

    const { data: metaTxData } = await forwarder.populateTransaction.execute(request, signature);
    if (!metaTxData) throw new Error('No data output from the transaction creation step');

    const { relayTransactionHash } = await itx.callContract(metaTxData, forwarder.address);

    const receipt = await itx.waitTransaction(relayTransactionHash);

    console.log("receipt: ", receipt);
}