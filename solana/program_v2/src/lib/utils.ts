import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Wallet, Program, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { IDL } from "../gateway_v2";
import { PROGRAM_ID } from "./constants";

/*
 * TODO: Move the connection endpoint and commitment as a parameter  - alternatively pass in the connection as a parameter (see cryptid/sol-did)
 *
 */
export const getAnchorProgram = (payer: Keypair) => {
  const wallet = new Wallet(payer);
  const connection = new Connection("http://localhost:8899", "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program(IDL, PROGRAM_ID, provider);
};

export const airdrop = async (
  connection: web3.Connection,
  account: web3.PublicKey,
  amount = anchor.web3.LAMPORTS_PER_SOL
) => {
  const sigAirdrop = await connection.requestAirdrop(account, amount);
  const latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    signature: sigAirdrop,
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  });
};
