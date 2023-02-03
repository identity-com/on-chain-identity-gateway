export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// A null object for passing into functions that require charge details.
// This is for future-proofing. The current version of Gateway-Eth does not
// support charges.
export const NULL_CHARGE = {
  value: 0,
  chargeType: 0,
  token: ZERO_ADDRESS,
  recipient: ZERO_ADDRESS,
};
