import {
  AuthKeyStructure,
  FeeStructure,
  SupportedToken,
  UpdateGatekeeperData,
  UpdateNetworkData,
} from '@identity.com/gateway-solana-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';

export const readKeyFromFile = (filename: string) => {
  if (!fs.existsSync(filename)) {
    throw new Error(`File not found: ${filename}`);
  }

  const filedata = fs.readFileSync(filename);

  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(filedata.toString()))
  );
};

export const parseNetworkUpdateData = (
  updateData: UpdateNetworkData
): UpdateNetworkData => {
  const keysArr = Object.keys(updateData);

  for (const key of keysArr) {
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
  }
  return updateData;
};

export const parseGatekeeperUpdateData = (
  updateData: UpdateGatekeeperData
): UpdateGatekeeperData => {
  const keysArr = Object.keys(updateData);

  for (const key of keysArr) {
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
  }
  return updateData;
};
