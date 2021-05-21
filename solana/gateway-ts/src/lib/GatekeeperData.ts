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
export class GatekeeperData extends Assignable {
  authority!: AssignablePublicKey;
  network!: AssignablePublicKey;

  static fromAccount(accountData: Buffer): GatekeeperData {
    return GatekeeperData.decode<GatekeeperData>(accountData);
  }
}

SCHEMA.set(GatekeeperData, {
  kind: "struct",
  fields: [
    ["authority", AssignablePublicKey],
    ["network", AssignablePublicKey],
  ],
});
