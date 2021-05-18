import { BinaryReader, BorshError, Schema, serialize } from "borsh";

// Class wrapping a plain object
export abstract class Assignable {
  constructor(properties: { [key: string]: any }) {
    Object.keys(properties).forEach((key: string) => {
      // this is probably possible in Typescript,
      // but requires (keyof this) which is not possible in the the cosntructor
      // @ts-ignore
      this[key] = properties[key];
    });
  }

  encode(): Buffer {
    return Buffer.from(serialize(SCHEMA, this));
  }

  static decode<T extends Assignable>(data: Buffer): T {
    return deserializeExtraBytes(SCHEMA, this, data);
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

export const SCHEMA: Schema = new Map();

// TODO PR for leaving extra bytes, a lot of code copied from
// https://github.com/near/borsh-js/blob/master/borsh-ts/index.ts

const capitalizeFirstLetter = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);

function deserializeField(
  schema: Schema,
  fieldName: string,
  fieldType: any,
  reader: BinaryReader
): any {
  try {
    // console.log("FIELD TYPE " + fieldType + " FIELD NAME " + fieldName);
    if (typeof fieldType === "string") {
      // @ts-ignore
      return reader[`read${capitalizeFirstLetter(fieldType)}`]();
    }

    if (Array.isArray(fieldType)) {
      if (typeof fieldType[0] === "number") {
        return reader.readFixedArray(fieldType[0]);
      }

      return reader.readArray(() =>
        deserializeField(schema, fieldName, fieldType[0], reader)
      );
    }

    return deserializeStruct(schema, fieldType, reader);
  } catch (error) {
    if (error instanceof BorshError) {
      error.addToFieldPath(fieldName);
    }
    throw error;
  }
}

function deserializeStruct(
  schema: Schema,
  classType: any,
  reader: BinaryReader
) {
  const structSchema = schema.get(classType);
  if (!structSchema) {
    throw new BorshError(`Class ${classType.name} is missing in schema`);
  }

  if (structSchema.kind === "struct") {
    const result: Record<string, any> = {};
    for (const [fieldName, fieldType] of schema.get(classType).fields) {
      result[fieldName] = deserializeField(
        schema,
        fieldName,
        fieldType,
        reader
      );
    }
    return new classType(result);
  }

  if (structSchema.kind === "enum") {
    const idx = reader.readU8();
    if (idx >= structSchema.values.length) {
      throw new BorshError(`Enum index: ${idx} is out of range`);
    }
    const [fieldName, fieldType] = structSchema.values[idx];
    const fieldValue = deserializeField(schema, fieldName, fieldType, reader);
    return new classType({ [fieldName]: fieldValue });
  }

  throw new BorshError(
    `Unexpected schema kind: ${structSchema.kind} for ${classType.constructor.name}`
  );
}

/// Deserializes object from bytes using schema.
export function deserializeExtraBytes<T extends Assignable>(
  schema: Schema,
  classType: any,
  buffer: Buffer
): T {
  const reader = new BinaryReader(buffer);
  return deserializeStruct(schema, classType, reader);
}
