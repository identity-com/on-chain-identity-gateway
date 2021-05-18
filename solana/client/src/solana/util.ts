import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import {
  GATEKEEPER_NONCE_SEED_STRING,
  PROGRAM_ID,
  SOLANA_COMMITMENT,
} from '../constants';

export const getGatekeeperAccountKeyFromGatekeeperAuthority = async (
  authority: PublicKey,
): Promise<PublicKey> => {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [authority.toBuffer(), Buffer.from(GATEKEEPER_NONCE_SEED_STRING, 'utf8')],
    PROGRAM_ID,
  );
  return publicKeyNonce[0];
};

export const send = (
  connection: Connection,
  transaction: Transaction,
  ...signers: Keypair[]
): Promise<TransactionSignature> =>
  sendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: false,
    commitment: SOLANA_COMMITMENT,
    preflightCommitment: 'recent',
  });
