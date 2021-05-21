import { Assignable, Enum, SCHEMA } from "./solanaBorsh";
import { PROGRAM_ID } from "./constants";
import {
  AccountMeta,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { Active, Frozen, GatewayTokenState, Revoked } from "./GatewayTokenData";

/**
 * Creates instructions to send to the gateway program.
 *
 * Must match solana/program/src/instruction.rs
 */

class AddGatekeeper extends Assignable {}
class IssueVanilla extends Assignable {}
class SetState extends Assignable {}

class GatewayInstruction extends Enum {
  addGatekeeper?: AddGatekeeper;

  static addGatekeeper(): GatewayInstruction {
    return new GatewayInstruction({
      addGatekeeper: new AddGatekeeper({}),
    });
  }

  static issueVanilla(seed: Uint8Array): GatewayInstruction {
    return new GatewayInstruction({
      issueVanilla: new IssueVanilla({ seed }),
    });
  }

  static revoke(): GatewayInstruction {
    return new GatewayInstruction({
      setState: new SetState({
        state: new GatewayTokenState({ revoked: new Revoked({}) }),
      }),
    });
  }

  static freeze(): GatewayInstruction {
    return new GatewayInstruction({
      setState: new SetState({
        state: new GatewayTokenState({ frozen: new Frozen({}) }),
      }),
    });
  }

  static unfreeze(): GatewayInstruction {
    return new GatewayInstruction({
      setState: new SetState({
        state: new GatewayTokenState({ active: new Active({}) }),
      }),
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

export function issueVanilla(
  seed: Uint8Array,
  gatewayTokenAccount: PublicKey,
  payer: PublicKey,
  gatekeeperAccount: PublicKey,
  owner: PublicKey,
  gatekeeperAuthority: PublicKey,
  gatekeeperNetwork: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: gatewayTokenAccount, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: gatekeeperAccount, isSigner: false, isWritable: false },
    { pubkey: gatekeeperAuthority, isSigner: true, isWritable: false },
    { pubkey: gatekeeperNetwork, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];
  const data = GatewayInstruction.issueVanilla(seed).encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

const getStateChangeAccountMeta = (
  gatewayTokenAccount: PublicKey,
  gatekeeperAuthority: PublicKey,
  gatekeeperAccount: PublicKey
): AccountMeta[] => [
  { pubkey: gatewayTokenAccount, isSigner: false, isWritable: true },
  { pubkey: gatekeeperAuthority, isSigner: true, isWritable: false },
  { pubkey: gatekeeperAccount, isSigner: false, isWritable: false },
  { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
];
export function revoke(
  gatewayTokenAccount: PublicKey,
  gatekeeperAuthority: PublicKey,
  gatekeeperAccount: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = getStateChangeAccountMeta(
    gatewayTokenAccount,
    gatekeeperAuthority,
    gatekeeperAccount
  );
  const data = GatewayInstruction.revoke().encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export function freeze(
  gatewayTokenAccount: PublicKey,
  gatekeeperAuthority: PublicKey,
  gatekeeperAccount: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = getStateChangeAccountMeta(
    gatewayTokenAccount,
    gatekeeperAuthority,
    gatekeeperAccount
  );
  const data = GatewayInstruction.freeze().encode();
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

export function unfreeze(
  gatewayTokenAccount: PublicKey,
  gatekeeperAuthority: PublicKey,
  gatekeeperAccount: PublicKey
): TransactionInstruction {
  const keys: AccountMeta[] = getStateChangeAccountMeta(
    gatewayTokenAccount,
    gatekeeperAuthority,
    gatekeeperAccount
  );
  const data = GatewayInstruction.unfreeze().encode();
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
    ["issueVanilla", IssueVanilla],
    ["setState", SetState],
  ],
});
SCHEMA.set(AddGatekeeper, {
  kind: "struct",
  fields: [],
});
SCHEMA.set(IssueVanilla, {
  kind: "struct",
  fields: [["seed", [1]]],
});
SCHEMA.set(SetState, {
  kind: "struct",
  fields: [["state", GatewayTokenState]],
});
