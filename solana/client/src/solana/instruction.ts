import { Assignable, Enum, SCHEMA } from "./solanaBorsh";
import { PROGRAM_ID } from "../constants";
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { GatewayToken } from "../index";
import { GatewayTokenState } from "./GatewayTokenData";

/**
 * Creates instructions to send to the gateway program.
 *
 * Must match solana/program/src/instruction.rs
 */

class AddGatekeeper extends Assignable {}

class SetState extends Assignable {
  state!: GatewayTokenState;
}

class GatewayInstruction extends Enum {
  addGatekeeper?: AddGatekeeper;
  setState?: SetState;

  static addGatekeeper(): GatewayInstruction {
    return new GatewayInstruction({
      addGatekeeper: new AddGatekeeper({}),
    });
  }

  static setState(state: GatewayTokenState): GatewayInstruction {
    return new GatewayInstruction({
      setState: new SetState({ state }),
    });
  }
}

export function addGatekeeper(
  payer: PublicKey,
  gatekeeperAccount: PublicKey,
  authority: PublicKey,
  network: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: gatekeeperAccount, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: network, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = GatewayInstruction.addGatekeeper().encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export function setState(
  payer: PublicKey,
  gatekeeperAccount: PublicKey,
  authority: PublicKey,
  network: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: gatekeeperAccount, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: network, isSigner: true, isWritable: false },
  ];
  const data = GatewayInstruction.addGatekeeper().encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

SCHEMA.set(GatewayInstruction, {
  kind: "enum",
  field: "enum",
  values: [
    ["addGatekeeper", AddGatekeeper],
    ["setState", SetState],
  ],
});
SCHEMA.set(AddGatekeeper, {
  kind: "struct",
  fields: [],
});
