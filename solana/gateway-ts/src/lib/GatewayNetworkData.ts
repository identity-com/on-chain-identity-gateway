import { Assignable, Enum, SCHEMA } from "./solanaBorsh";

export class UserTokenExpiry extends Assignable {}
export class NetworkFeature extends Enum {
  userTokenExpiry?: UserTokenExpiry;
}

SCHEMA.set(NetworkFeature, {
  kind: "enum",
  field: "enum",
  values: [["userTokenExpiry", UserTokenExpiry]],
});
SCHEMA.set(UserTokenExpiry, { kind: "struct", fields: [] });

export const mapEnumToFeatureName = (enumValue: string) => {
  if (enumValue === "userTokenExpiry") {
    return "expire";
  }

  return enumValue;
};
