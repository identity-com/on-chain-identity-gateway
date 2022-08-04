import * as anchor from '@project-serum/anchor';
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import  {AnchorProvider, Wallet, Program} from "@project-serum/anchor";
import idl from "../gateway_v2.json";
import {DEFAULT_SEED_STRING, GATE_WAY_PROGRAM, PROGRAM_ID} from "./constants";

/*
 * TODO: Move the connection endpoint and commitment as a parameter  - alternatively pass in the connection as a paramewter (see cryptid/sol-did)
 *
 */
// export const getAnchorProgram = (payer: Keypair) => {
//     const wallet = new Wallet(payer);
//     const connection = new Connection('http://localhost:9009', 'confirmed');
//     const provider = new AnchorProvider(connection,wallet, {
//         commitment: "confirmed"
//     });

//     return new Program(idl, PROGRAM_ID, provider);
// }

export const findProgramAddress = async (authority: PublicKey) =>
  PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(DEFAULT_SEED_STRING), authority.toBuffer()],
    GATE_WAY_PROGRAM
  );