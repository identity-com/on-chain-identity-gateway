import { Schema, serialize, deserialize } from "borsh";

export const SCHEMA: Schema = new Map();

// Class wrapping a plain object
export abstract class Assignable {
  constructor(properties: { [key: string]: any }) {
    Object.keys(properties).forEach((key: string) => {
      // this is probably possible in Typescript,
      // but requires (keyof this) which is not possible in the the constructor
      // @ts-ignore
      this[key] = properties[key];
    });
  }

  encode(): Buffer {
    return Buffer.from(serialize(SCHEMA, this));
  }

  static decode<T extends Assignable>(data: Buffer): T {
    return deserialize(SCHEMA, this, data);
  }
}

// Class representing a Rust-compatible enum, since enums are only strings or
// numbers in pure JS
export abstract class Enum extends Assignable {
  enum: string;

  constructor(properties: any) {
    super(properties);
    if (Object.keys(properties).length !== 1) {
      throw new Error("Enum can only take single value");
    }
    this.enum = "";
    Object.keys(properties).forEach((key) => {
      this.enum = key;
    });
  }
}
