import {
  BN,
  Program,
  Provider,
  setProvider,
  Wallet,
  web3,
  workspace,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Usage } from "../../target/types/usage";

export const USAGE_PROGRAM_ID = new web3.PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);
const DEFAULT_COMMITMENT: web3.Commitment = "confirmed";

export type ExtendedCluster = web3.Cluster | "localnet" | "civicnet";
export const CIVICNET_URL =
  "http://ec2-34-238-243-215.compute-1.amazonaws.com:8899";

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
  keypair: web3.Keypair,
  cluster: ExtendedCluster = "localnet"
): Provider => {
  const connection = new web3.Connection(
    getClusterUrl(cluster),
    DEFAULT_COMMITMENT
  );
  const wallet = new Wallet(keypair);
  return new Provider(connection, wallet, {
    commitment: DEFAULT_COMMITMENT,
  });
};

export const fetchProgram = async (
  provider: Provider
): Promise<Program<Usage>> => {
  const workspaceProgram = workspace?.Usage as Program<Usage>;

  if (workspaceProgram) {
    return new Program<Usage>(
      workspaceProgram.idl,
      workspaceProgram.programId,
      provider
    );
  }
  const idl = await Program.fetchIdl(USAGE_PROGRAM_ID, provider);

  if (!idl) throw new Error("Usage IDL could not be found");

  return new Program(idl, USAGE_PROGRAM_ID, provider) as Program<Usage>;
};

export const deriveUsageAccount = async (
  dapp: web3.PublicKey,
  gatekeeper: web3.PublicKey,
  oracle: web3.PublicKey,
  epoch: number
): Promise<[web3.PublicKey, number]> => {
  // the epoch is used to seed the usage account,
  // so each epoch has its own account
  // the endianness does not actually matter here, we could choose big-endian
  // as long as it is mirrored in the `seeds=[...]` macro in the Register definition
  // in the program.
  const epochBuffer = new BN(epoch).toBuffer("le", 8);

  return web3.PublicKey.findProgramAddress(
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
  dapp: web3.PublicKey,
  oracle: web3.PublicKey
): Promise<[web3.PublicKey, number]> =>
  await web3.PublicKey.findProgramAddress(
    [Buffer.from("gateway_usage_delegate"), dapp.toBuffer(), oracle.toBuffer()],
    USAGE_PROGRAM_ID
  );

export const deriveATA = async (
  owner: web3.PublicKey,
  mint: web3.PublicKey
): Promise<web3.PublicKey> =>
  (
    await web3.PublicKey.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
