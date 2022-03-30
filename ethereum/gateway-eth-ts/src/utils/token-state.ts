import { TokenData } from "./types";

export const checkTokenState = (state: number | string): string => {
  switch (state) {
    case 0:
      return "ACTIVE";
    case 1:
      return "FROZEN";
    case 2:
      return "REVOKED";
    default:
      return "";
  }
};

export const parseTokenState = (tokenData: TokenData): TokenData => {
  const parsedData: TokenData = {
    owner: tokenData.owner,
    state: checkTokenState(tokenData.state),
    identity: tokenData.identity,
    expiration: tokenData.expiration.toString(),
    bitmask: tokenData.bitmask.toString(),
  };

  return parsedData;
};
