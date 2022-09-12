import { Commitment, PublicKey } from "@solana/web3.js";

export const REGISTER = "./register.csv";

// Should equal the contents of solana/program/program-id.md
export const PROGRAM_ID: PublicKey = new PublicKey(
  "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
);
export const SOLANA_COMMITMENT: Commitment = "confirmed";