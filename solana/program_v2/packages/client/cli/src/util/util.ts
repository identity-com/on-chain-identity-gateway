import {
  AuthKeyStructure,
  FeeStructure,
  SupportedToken,
  UpdateGatekeeperData,
  UpdateNetworkData,
} from '@identity.com/gateway-solana-client';
import { PublicKey } from '@solana/web3.js';

export const parseNetworkUpdateData = (
  updateData: UpdateNetworkData
): UpdateNetworkData => {
  const keysArr = Object.keys(updateData);
  // eslint-disable-next-line unicorn/no-array-for-each
  keysArr.forEach((key) => {
    if (key === 'fees') {
      updateData[key].add.map((fee: FeeStructure) => {
        fee.token = new PublicKey(fee.token);
        return fee;
      });
      updateData[key].remove.map((fee: PublicKey) => new PublicKey(fee));
    }
    if (key === 'authKeys') {
      updateData[key].add.map((authKey: AuthKeyStructure) => {
        authKey.key = new PublicKey(authKey.key);
        return authKey;
      });
      updateData[key].remove.map(
        (authKey: PublicKey) => new PublicKey(authKey)
      );
    }
    if (key === 'supportedTokens') {
      updateData[key].add.map((token: SupportedToken) => {
        token.key = new PublicKey(token.key);
        return token;
      });
      updateData[key].remove.map((token: PublicKey) => new PublicKey(token));
    }
  });
  return updateData;
};

export const parseGatekeeperUpdateData = (
  updateData: UpdateGatekeeperData
): UpdateGatekeeperData => {
  const keysArr = Object.keys(updateData);
  // eslint-disable-next-line unicorn/no-array-for-each
  keysArr.forEach((key) => {
    if (key === 'tokenFees') {
      updateData[key].add.map((fee: FeeStructure) => {
        fee.token = new PublicKey(fee.token);
        return fee;
      });
      updateData[key].remove.map((fee: PublicKey) => new PublicKey(fee));
    }
    if (key === 'authKeys') {
      updateData[key].add.map((authKey: AuthKeyStructure) => {
        authKey.key = new PublicKey(authKey.key);
        return authKey;
      });
      updateData[key].remove.map(
        (authKey: PublicKey) => new PublicKey(authKey)
      );
    }
  });
  return updateData;
};
