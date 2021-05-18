import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  GATEKEEPER_NONCE_SEED_STRING,
  GATEWAY_TOKEN_ADDRESS_SEED,
  PROGRAM_ID,
  SOLANA_COMMITMENT,
} from "../constants";

export const getGatekeeperAccountKeyFromGatekeeperAuthority = async (
  authority: PublicKey
): Promise<PublicKey> => {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [authority.toBuffer(), Buffer.from(GATEKEEPER_NONCE_SEED_STRING, "utf8")],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
};

export const getGatewayTokenKeyForOwner = async (
  owner: PublicKey,
  seed?: Uint8Array
): Promise<PublicKey> => {
  const additionalSeed = seed
    ? Buffer.from(seed)
    : Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
  const seeds = [
    owner.toBuffer(),
    Buffer.from(GATEWAY_TOKEN_ADDRESS_SEED, "utf8"),
    additionalSeed,
  ];

  const publicKeyNonce = await PublicKey.findProgramAddress(seeds, PROGRAM_ID);
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
    preflightCommitment: "recent",
  });
