import { Keypair, PublicKey } from "@solana/web3.js";
import { Assignable, Enum, SCHEMA } from "./solanaBorsh";
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
  issuingGatekeeper!: AssignablePublicKey;
  gatekeeperNetwork!: AssignablePublicKey;
  state!: GatewayTokenState;
  parentGatewayToken?: AssignablePublicKey;

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

export class Active extends Assignable {}
export class Frozen extends Assignable {}
export class Revoked extends Assignable {}
class GatewayTokenState extends Enum {
  active?: Active;
  frozen?: Frozen;
  revoked?: Revoked;
}

SCHEMA.set(GatewayTokenData, {
  kind: "struct",
  fields: [
    ["features", [1]],
    ["parentGatewayToken", { kind: "option", type: AssignablePublicKey }],
    ["owner", AssignablePublicKey],
    ["ownerIdentity", [1]], // TODO Option<>
    ["gatekeeperNetwork", AssignablePublicKey],
    ["issuingGatekeeper", AssignablePublicKey],
    ["state", GatewayTokenState],
    ["expiry", [1]], // TODO Option<>
  ],
});
SCHEMA.set(GatewayTokenState, {
  kind: "enum",
  field: "enum",
  values: [
    ["active", Active],
    ["frozen", Frozen],
    ["revoked", Revoked],
  ],
});
SCHEMA.set(Active, { kind: "struct", fields: [] });
SCHEMA.set(Frozen, { kind: "struct", fields: [] });
SCHEMA.set(Revoked, { kind: "struct", fields: [] });
