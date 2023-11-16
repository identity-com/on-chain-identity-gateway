import { BigNumber, ethers, PopulatedTransaction } from "ethers";
import {
  DEFAULT_CHARGE_HANDLER_ADDRESS,
  DEFAULT_GATEWAY_TOKEN_ADDRESS,
} from "./constants";
import { Provider } from "@ethersproject/providers";
import { ChargeHandler__factory } from "../contracts/typechain-types";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export enum ChargeType {
  NONE,
  ETH,
  ERC20,
}

export type Charge = {
  value: BigNumber;
  chargeType: ChargeType;
  token: string;
  recipient: string;
  tokenSender: string;
};

// A null object for passing into functions that require charge details, when no charge is incurred
export const NULL_CHARGE: Charge = {
  value: BigNumber.from(0),
  chargeType: ChargeType.NONE,
  token: ZERO_ADDRESS,
  recipient: ZERO_ADDRESS,
  tokenSender: ZERO_ADDRESS,
};

export const makeWeiCharge = (value: BigNumber, recipient: string) => ({
  token: ZERO_ADDRESS,
  chargeType: ChargeType.ETH,
  value,
  recipient,
  tokenSender: ZERO_ADDRESS,
});

export const makeERC20Charge = (
  value: BigNumber,
  token: string,
  tokenSender: string,
  tokenRecipient: string
) => ({
  token,
  chargeType: ChargeType.ERC20,
  value,
  recipient: tokenRecipient,
  tokenSender,
});

export const approveERC20Charge = (
  charge: Charge,
  provider: Provider,
  contract: string = DEFAULT_CHARGE_HANDLER_ADDRESS
): Promise<PopulatedTransaction> => {
  if (charge.chargeType !== ChargeType.ERC20) {
    throw new Error("Invalid charge type - must be ERC20");
  }
  const sparseERC20Interface = [
    "function approve(address spender, uint256 amount) public returns (bool)",
  ];
  const tokenContract = new ethers.Contract(
    charge.token,
    sparseERC20Interface,
    provider
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return tokenContract.populateTransaction.approve(contract, charge.value);
};

export const approveInternalERC20Charge = (
  charge: Charge,
  network: bigint,
  provider: Provider,
  chargeContractAddress: string = DEFAULT_GATEWAY_TOKEN_ADDRESS,
  gatewayContractAddress: string = DEFAULT_GATEWAY_TOKEN_ADDRESS
): Promise<PopulatedTransaction> => {
  if (charge.chargeType !== ChargeType.ERC20) {
    throw new Error("Invalid charge type - must be ERC20");
  }

  const chargeContract = ChargeHandler__factory.connect(
    chargeContractAddress,
    provider
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  return chargeContract.populateTransaction.setApproval(
    gatewayContractAddress,
    charge.token,
    charge.value,
    network
  );
};
