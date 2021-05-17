import { Keypair, PublicKey } from "@solana/web3.js";
import { Assignable, SCHEMA } from "./solanaBorsh";

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

/**
 * The on-chain structure of a gateway token.
 * Matches: solana/integration-lib/src/state.rs
 */
export class GatewayTokenData extends Assignable {
  owner!: AssignablePublicKey;

  static fromAccount(accountData: Buffer): GatewayTokenData {
    return GatewayTokenData.decode<GatewayTokenData>(accountData);
  }

  forAuthority(authority: PublicKey) {
    return new GatewayTokenData({
      ...this,
      authority: AssignablePublicKey.fromPublicKey(authority),
    });
  }

  static empty(owner?: PublicKey): GatewayTokenData {
    return new GatewayTokenData({
      owner: AssignablePublicKey.fromPublicKey(
        owner || Keypair.generate().publicKey
      ),

      alias: "",
      messages: [],
    });
  }
}

SCHEMA.set(GatewayTokenData, {
  kind: "struct",
  fields: [["owner", AssignablePublicKey]],
});
SCHEMA.set(AssignablePublicKey, {
  kind: "struct",
  fields: [["bytes", [32]]],
});
