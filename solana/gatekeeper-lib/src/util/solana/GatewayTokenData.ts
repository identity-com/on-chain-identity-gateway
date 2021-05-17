import { Keypair, PublicKey } from "@solana/web3.js";
import { Assignable, SCHEMA } from "./solanaBorsh";
import { AssignablePublicKey } from "./AssignablePublicKey";

/**
 * The on-chain structure of a gateway token.
 * Matches: solana/integration-lib/src/state.rs
 *
 * The pattern for these objects is to have their properties dynamically
 * assigned by borsh.decode, as opposed to via a constructor.
 *
 * The imperative assignment operator (!) is used to avoid Typescript
 * complaining about the above.
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
