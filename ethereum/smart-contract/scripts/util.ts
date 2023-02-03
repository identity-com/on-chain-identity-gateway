import {HardhatRuntimeEnvironment} from "hardhat/types";

// A bug in hardhat leads to undefined entries in the accounts if any are duplicates.
// This function normalises this by creating defaults for each one
export const getAccounts = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts } = hre;
    const {deployer, authority, gatekeeper} = await getNamedAccounts();
    return {
        deployer,
        authority: authority || deployer,
        gatekeeper: gatekeeper || deployer,
    }
}