import { Commitment, PublicKey } from "@solana/web3.js";

// Should equal the contents of solana/program/program-id.md
export const PROGRAM_ID: PublicKey = new PublicKey(
  "EjpEDmrHx31n9BveXgPXj26YL5UktdJmnhm68Q77TCwy"
);
export const GATEKEEPER_NONCE_SEED_STRING = "gatekeeper"; // must match get_inbox_address_with_seed in state.rs
export const GATEWAY_TOKEN_ADDRESS_SEED = "gateway"; // must match get_inbox_address_with_seed in state.rs

export const SOLANA_COMMITMENT: Commitment = "confirmed";
