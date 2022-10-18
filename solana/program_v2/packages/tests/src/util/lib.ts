import { Keypair, PublicKey } from '@solana/web3.js';
import { NetworkService } from '@identity.com/gateway_v2-client/src/NetworkService';

export const loadPrivateKey = (publicKeyBs58: string): Keypair => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require(`../../fixtures/keypairs/${publicKeyBs58}.json`);

  return Keypair.fromSecretKey(new Uint8Array(data));
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
