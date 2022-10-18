import { Keypair, PublicKey } from '@solana/web3.js';
import { NetworkService } from '@identity.com/gateway_v2-client/src/NetworkService';
import fsPromises from 'node:fs/promises';

export const loadPrivateKey = async (
  publicKeyBs58: string
): Promise<Keypair> => {
  const keyFileBuffer = await fsPromises.readFile(
    `${__dirname}/../../fixtures/keypairs/${publicKeyBs58}.json`
  );
  const privateKey = Uint8Array.from(JSON.parse(keyFileBuffer.toString()));
  return Keypair.fromSecretKey(privateKey);
};

export const setGatekeeperFlags = async (
  stakingAccount: PublicKey,
  service: NetworkService,
  flags: number
): Promise<void> => {
  await service
    .updateGatekeeper(
      {
        authThreshold: 1,
        tokenFees: { remove: [], add: [] },
        authKeys: {
          add: [
            {
              key: service.getWallet().publicKey,
              flags: flags,
            },
          ],
          remove: [],
        },
      },
      stakingAccount
    )
    .rpc();
};
