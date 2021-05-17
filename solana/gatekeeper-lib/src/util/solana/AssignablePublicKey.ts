import { Assignable, SCHEMA } from "./solanaBorsh";
import { PublicKey } from "@solana/web3.js";

/**
 * A Borsh-compatible public key object
 *
 * The pattern for these objects is to have their properties dynamically
 * assigned by borsh.decode, as opposed to via a constructor.
 *
 * The imperative assignment operator (!) is used to avoid Typescript
 * complaining about the above.
 */
export class AssignablePublicKey extends Assignable {
  // The public key bytes
  bytes!: number[];

  toPublicKey(): PublicKey {
    return new PublicKey(this.bytes);
  }

  toString(): string {
    return this.toPublicKey().toBase58();
  }

  static parse(pubkey: string): AssignablePublicKey {
    return AssignablePublicKey.fromPublicKey(new PublicKey(pubkey));
  }

  static fromPublicKey(publicKey: PublicKey): AssignablePublicKey {
    return new AssignablePublicKey({
      bytes: Uint8Array.from(publicKey.toBuffer()),
    });
  }

  static empty(): AssignablePublicKey {
    const bytes = new Array(32);
    bytes.fill(0);
    return new AssignablePublicKey({ bytes });
  }
}

SCHEMA.set(AssignablePublicKey, {
  kind: "struct",
  fields: [["bytes", [32]]],
});
