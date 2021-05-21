import { AccountInfo, PublicKey } from "@solana/web3.js";

export type GatewayToken = {
  //  the key used to reference the issuing gatekeeper
  issuingGatekeeper: PublicKey;
  gatekeeperNetwork: PublicKey;
  owner: PublicKey;
  isValid: boolean;
  publicKey: PublicKey;
  programId: PublicKey;
};

export type ProgramAccountResponse = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
};
