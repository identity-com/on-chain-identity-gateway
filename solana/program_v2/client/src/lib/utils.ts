import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider, Wallet, Program } from "@project-serum/anchor";
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
