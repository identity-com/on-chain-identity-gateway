import { Commitment, PublicKey } from "@solana/web3.js";

export const COUNTRY_BLACKLIST = ["US"];
export const REGISTER = "./register.csv";
export const REGISTER_BUCKET_S3 = "ociv-register.civic.com";

// Should equal the contents of solana/program/program-id.md
export const PROGRAM_ID: PublicKey = new PublicKey(
  "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
);
export const GATEKEEPER_NONCE_SEED_STRING = "gatekeeper"; // must match get_inbox_address_with_seed in state.rs
export const GATEWAY_TOKEN_ADDRESS_SEED = "gateway"; // must match get_inbox_address_with_seed in state.rs

export const SOLANA_COMMITMENT: Commitment = "confirmed";
