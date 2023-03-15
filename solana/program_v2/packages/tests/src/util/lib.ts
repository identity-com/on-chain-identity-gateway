import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  airdrop,
  FeeStructure,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import * as fsPromises from 'node:fs/promises';
import * as anchor from '@coral-xyz/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace
  .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
const programProvider = program.provider as anchor.AnchorProvider;

export const generateFundedKey = async (): Promise<Keypair> => {
  const keypair = Keypair.generate();
  await airdrop(
    programProvider.connection,
    keypair.publicKey,
    LAMPORTS_PER_SOL
  );
  return keypair;
};

export const loadPrivateKey = async (
  publicKeyBs58: string
): Promise<Keypair> => {
  const keyFileBuffer = await fsPromises.readFile(
    `${__dirname}/../../fixtures/keypairs/${publicKeyBs58}.json`
  );
  const privateKey = Uint8Array.from(JSON.parse(keyFileBuffer.toString()));
  return Keypair.fromSecretKey(privateKey);
};

export const setGatekeeperFlagsAndFees = async (
  stakingAccount: PublicKey,
  service: NetworkService,
  flags: number,
  feesToAdd: FeeStructure[] = []
): Promise<void> => {
  await service
    .updateGatekeeper(
      {
        authThreshold: 1,
        tokenFees: {
          remove: [],
          add: feesToAdd,
        },
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
