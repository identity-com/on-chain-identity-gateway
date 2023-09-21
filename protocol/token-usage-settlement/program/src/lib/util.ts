import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Cluster, Keypair } from "@solana/web3.js";
import { Commitment } from "@solana/web3.js";
import { Usage } from "../../target/types/usage";
import { Program } from "@project-serum/anchor";

const { web3, Wallet, BN } = anchor;

export const USAGE_PROGRAM_ID = new PublicKey(
  "GXD3V5AQTDrszePsSjH1yQNvfCceumZp1jM9mQR4fMPH"
);
const DEFAULT_COMMITMENT: Commitment = "confirmed";

export type ExtendedCluster = Cluster | "localnet" | "civicnet";
export const CIVICNET_URL =
  "http://ec2-44-214-135-83.compute-1.amazonaws.com:8899";

export const getClusterUrl = (cluster: ExtendedCluster): string => {
  switch (cluster) {
    case "localnet":
      return "http://localhost:8899";
    case "civicnet":
      return CIVICNET_URL;
    default:
      return web3.clusterApiUrl(cluster);
  }
};

export const providerFor = (
  keypair: Keypair,
  cluster: ExtendedCluster = "localnet"
): anchor.Provider => {
  const connection = new web3.Connection(
    getClusterUrl(cluster),
    DEFAULT_COMMITMENT
  );
  const wallet = new Wallet(keypair);
  return new anchor.Provider(connection, wallet, {
    commitment: DEFAULT_COMMITMENT,
  });
};

export const fetchProgram = async (
  provider: anchor.Provider,
  workspaceProgram?: Program<Usage>
): Promise<anchor.Program<Usage>> => {
  if (workspaceProgram)
    return new anchor.Program<Usage>(
      workspaceProgram.idl,
      workspaceProgram.programId,
      provider
    );

  const idl = await anchor.Program.fetchIdl(USAGE_PROGRAM_ID, provider);

  if (!idl) throw new Error("Usage IDL could not be found");

  return new anchor.Program(
    idl,
    USAGE_PROGRAM_ID,
    provider
  ) as anchor.Program<Usage>;
};

export const deriveUsageAccount = async (
  dapp: PublicKey,
  gatekeeper: PublicKey,
  oracle: PublicKey,
  epoch: number
): Promise<[PublicKey, number]> => {
  // the epoch is used to seed the usage account,
  // so each epoch has its own account
  // the endianness does not actually matter here, we could choose big-endian
  // as long as it is mirrored in the `seeds=[...]` macro in the RegisterUsage definition
  // in the program.
  const epochBuffer = new BN(epoch).toBuffer("le", 8);

  return PublicKey.findProgramAddress(
    [
      Buffer.from("gateway_usage"),
      dapp.toBuffer(),
      gatekeeper.toBuffer(),
      oracle.toBuffer(),
      epochBuffer,
    ],
    USAGE_PROGRAM_ID
  );
};

export const deriveDelegateAndBumpSeed = async (
  dapp: PublicKey,
  oracle: PublicKey
): Promise<[PublicKey, number]> =>
  await PublicKey.findProgramAddress(
    [Buffer.from("gateway_usage_delegate"), dapp.toBuffer(), oracle.toBuffer()],
    USAGE_PROGRAM_ID
  );

export const deriveATA = async (
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> =>
  (
    await PublicKey.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
