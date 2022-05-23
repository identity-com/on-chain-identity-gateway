import { Connection, PublicKey } from "@solana/web3.js";

export type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export interface Deserialize<T> {
  read(buffer: Buffer, offset: { offset: number }): T;
}
export interface Serialize {
  write(buffer: Buffer, offset: { offset: number }): void;
  serializedSize(): number;
}

export interface StaticSize {
  staticSize(): number;
}

export interface Equals<T> {
  equals(other: T): boolean;
}

export interface Account<D, T> {
  discriminant(): D;
}
export interface Instruction<D extends Serialize, T extends Serialize> {
  discriminant(): D;
}

export class SerializablePublicKey
  implements Serialize, Equals<SerializablePublicKey>, Equals<PublicKey>
{
  constructor(public key: PublicKey) {}

  write(buffer: Buffer, offset: { offset: number }): void {
    this.key.toBuffer().copy(buffer, offset.offset);
    offset.offset += 32;
  }
  serializedSize(): number {
    return 32;
  }

  static read(
    buffer: Buffer,
    offset: { offset: number }
  ): SerializablePublicKey {
    const key = new PublicKey(buffer.slice(offset.offset, offset.offset + 32));
    offset.offset += 32;
    return new SerializablePublicKey(key);
  }

  static staticSize(): number {
    return 32;
  }

  equals(other: SerializablePublicKey | PublicKey): boolean {
    if (other instanceof SerializablePublicKey) {
      return this.key.equals(other.key);
    } else {
      return this.key.equals(other);
    }
  }
}

export type Cons<T> = new (...args: any[]) => T;
export function readAccount<D extends Equals<D>, T>(
  dCons: Cons<D> & Deserialize<D>,
  tCons: Cons<T> & Deserialize<T> & Account<D, T>,
  buffer: Buffer,
  offset: { offset: number } = { offset: 0 }
): T | null {
  const discriminant = dCons.read(buffer, offset);
  if (discriminant.equals(tCons.discriminant())) {
    return tCons.read(buffer, offset);
  } else {
    return null;
  }
}

export function serializeInstruction<D extends Serialize, T extends Serialize>(
  tCons: Cons<T> & Instruction<D, T>,
  instruction: T
): Buffer {
  const discriminant = tCons.discriminant();
  const buffer = Buffer.alloc(
    discriminant.serializedSize() + instruction.serializedSize()
  );
  const offset = { offset: 0 };
  discriminant.write(buffer, offset);
  instruction.write(buffer, offset);
  return buffer;
}

export function serializeArray<T extends Serialize, S extends Serialize>(
  array: T[],
  size: Cons<S> & (new (arg: number) => S),
  buffer: Buffer,
  offset: { offset: number }
) {
  new size(array.length).write(buffer, offset);
  for (const element of array) {
    element.write(buffer, offset);
  }
}

export function readPublicKey(
  buffer: Buffer,
  offset: { offset: number }
): PublicKey {
  const public_key = new PublicKey(
    buffer.slice(offset.offset, offset.offset + 32)
  );
  offset.offset += 32;
  return public_key;
}

export function readArray<T>(
  buffer: Buffer,
  offset: { offset: number },
  length: number,
  readInner: (buffer: Buffer, offset: { offset: number }) => T
): T[] {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(readInner(buffer, offset));
  }
  return result;
}

export type Bounds<T> = {
  min: T;
  max: T;
};

export class i8 implements Serialize, Equals<i8>, Equals<number> {
  static readonly bounds: Bounds<number> = {
    min: -128,
    max: 127,
  };
  constructor(public value: number) {
    if (value < i8.bounds.min || value > i8.bounds.max) {
      throw new Error(
        `${value} is not in range ${i8.bounds.min}..${i8.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeInt8(this.value, offset.offset);
    offset.offset += 1;
  }
  serializedSize(): number {
    return i8.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): i8 {
    const value = buffer.readInt8(offset.offset);
    offset.offset += 1;
    return new i8(value);
  }

  static staticSize(): number {
    return 1;
  }

  equals(other: i8 | number): boolean {
    if (other instanceof i8) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class i16 implements Serialize, Equals<i16>, Equals<number> {
  static readonly bounds: Bounds<number> = {
    min: -32768,
    max: 32767,
  };
  constructor(public value: number) {
    if (value < i16.bounds.min || value > i16.bounds.max) {
      throw new Error(
        `${value} is not in range ${i16.bounds.min}..${i16.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeInt16LE(this.value, offset.offset);
    offset.offset += 2;
  }

  serializedSize(): number {
    return i16.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): i16 {
    const value = buffer.readInt16LE(offset.offset);
    offset.offset += 2;
    return new i16(value);
  }

  static staticSize(): number {
    return 2;
  }

  equals(other: i16 | number): boolean {
    if (other instanceof i16) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class i32 implements Serialize, Equals<i32>, Equals<number> {
  static readonly bounds: Bounds<number> = {
    min: -2147483648,
    max: 2147483647,
  };
  constructor(public value: number) {
    if (value < i32.bounds.min || value > i32.bounds.max) {
      throw new Error(
        `${value} is not in range ${i32.bounds.min}..${i32.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeInt32LE(this.value, offset.offset);
    offset.offset += 4;
  }
  serializedSize(): number {
    return i32.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): i32 {
    const value = buffer.readInt32LE(offset.offset);
    offset.offset += 4;
    return new i32(value);
  }

  static staticSize(): number {
    return 4;
  }

  equals(other: i32 | number): boolean {
    if (other instanceof i32) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class i64 implements Serialize, Equals<i64>, Equals<bigint> {
  static readonly bounds: Bounds<bigint> = {
    min: -9223372036854775808n,
    max: 9223372036854775807n,
  };

  constructor(public value: bigint) {
    if (value < i64.bounds.min || value > i64.bounds.max) {
      throw new Error(
        `${value} is not in range ${i64.bounds.min}..${i64.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeBigInt64LE(this.value, offset.offset);
    offset.offset += 8;
  }
  serializedSize(): number {
    return i64.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): i64 {
    const value = buffer.readBigInt64LE(offset.offset);
    offset.offset += 8;
    return new i64(value);
  }

  static staticSize(): number {
    return 8;
  }

  equals(other: i64 | bigint): boolean {
    if (other instanceof i64) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class u8 implements Serialize, Equals<u8>, Equals<number> {
  static readonly bounds: Bounds<number> = {
    min: 0,
    max: 255,
  };
  constructor(public value: number) {
    if (value < u8.bounds.min || value > u8.bounds.max) {
      throw new Error(
        `${value} is not in range ${u8.bounds.min}..${u8.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeUInt8(this.value, offset.offset);
    offset.offset += 1;
  }

  serializedSize(): number {
    return u8.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): u8 {
    const value = buffer.readUInt8(offset.offset);
    offset.offset += 1;
    return new u8(value);
  }

  static staticSize(): number {
    return 1;
  }

  equals(other: u8 | number): boolean {
    if (other instanceof u8) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class u16 implements Serialize, Equals<u16>, Equals<number> {
  static readonly bounds: Bounds<number> = {
    min: 0,
    max: 65535,
  };
  constructor(public value: number) {
    if (value < u16.bounds.min || value > u16.bounds.max) {
      throw new Error(
        `${value} is not in range ${u16.bounds.min}..${u16.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeUInt16LE(this.value, offset.offset);
    offset.offset += 2;
  }

  serializedSize(): number {
    return u16.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): u16 {
    const value = buffer.readUInt16LE(offset.offset);
    offset.offset += 2;
    return new u16(value);
  }

  static staticSize(): number {
    return 2;
  }

  equals(other: u16 | number): boolean {
    if (other instanceof u16) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class u32 implements Serialize, Equals<u32>, Equals<number> {
  static readonly bounds: Bounds<number> = {
    min: 0,
    max: 4294967295,
  };
  constructor(public value: number) {
    if (value < u32.bounds.min || value > u32.bounds.max) {
      throw new Error(
        `${value} is not in range ${u32.bounds.min}..${u32.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeUInt32LE(this.value, offset.offset);
    offset.offset += 4;
  }

  serializedSize(): number {
    return u32.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): u32 {
    const value = buffer.readUInt32LE(offset.offset);
    offset.offset += 4;
    return new u32(value);
  }

  static staticSize(): number {
    return 4;
  }

  equals(other: u32 | number): boolean {
    if (other instanceof u32) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class u64 implements Serialize, Equals<u64>, Equals<bigint> {
  static readonly bounds: Bounds<bigint> = {
    min: 0n,
    max: 0xffff_ffff_ffff_ffffn,
  };
  constructor(public value: bigint) {
    if (value < u64.bounds.min || value > u64.bounds.max) {
      throw new Error(
        `${value} is not in range ${u64.bounds.min}..${u64.bounds.max}`
      );
    }
  }

  write(buffer: Buffer, offset: { offset: number }): void {
    buffer.writeBigUInt64LE(this.value, offset.offset);
    offset.offset += 8;
  }

  serializedSize(): number {
    return u64.staticSize();
  }

  static read(buffer: Buffer, offset: { offset: number }): u64 {
    const value = buffer.readBigUInt64LE(offset.offset);
    offset.offset += 8;
    return new u64(value);
  }

  static staticSize(): number {
    return 8;
  }

  equals(other: u64 | bigint): boolean {
    if (other instanceof u64) {
      return this.value === other.value;
    } else {
      return this.value === other;
    }
  }
}

export class NetworkFees implements Serialize {
  constructor(
    public token: PublicKey,
    public issue: u16,
    public refresh: u16,
    public expire: u16,
    public verify: u16
  ) {}
  write(buffer: Buffer, offset: { offset: number }): void {
    new SerializablePublicKey(this.token).write(buffer, offset);
    this.issue.write(buffer, offset);
    this.refresh.write(buffer, offset);
    this.expire.write(buffer, offset);
    this.verify.write(buffer, offset);
  }
  serializedSize(): number {
    return (
      new SerializablePublicKey(this.token).serializedSize() +
      this.issue.serializedSize() +
      this.refresh.serializedSize() +
      this.expire.serializedSize() +
      this.verify.serializedSize()
    );
  }

  static size(): number {
    return 32 + 4 * 2;
  }
  static read(buffer: Buffer, offset: { offset: number }): NetworkFees {
    const token = readPublicKey(buffer, offset);
    const issue = u16.read(buffer, offset);
    const refresh = u16.read(buffer, offset);
    const expire = u16.read(buffer, offset);
    const verify = u16.read(buffer, offset);

    return new NetworkFees(token, issue, refresh, expire, verify);
  }
}

export enum NetworkKeyFlagsValues {
  /** Key can change keys */
  AUTH = 1 << 0,
  /** Key can set network features (User expiry, did issuance, etc.) */
  SET_FEATURES = 1 << 1,
  /** Key can create new gatekeepers */
  CREATE_GATEKEEPER = 1 << 2,
  /** Key can freeze gatekeepers */
  FREEZE_GATEKEEPER = 1 << 3,
  /** Key can unfreeze gatekeepers */
  UNFREEZE_GATEKEEPER = 1 << 4,
  /** Key can halt gatekeepers */
  HALT_GATEKEEPER = 1 << 5,
  /** Key can un-halt gatekeepers */
  UNHALT_GATEKEEPER = 1 << 6,
  /** Key can un-revoke passes with gatekeepers */
  UNREVOKE_PASS = 1 << 7,
  /** Key can adjust fees */
  ADJUST_FEES = 1 << 8,
  /** Key can add new fee types to a network */
  ADD_FEES = 1 << 9,
  /** Key can access the network's vault */
  ACCESS_VAULT = 1 << 10,
}
export const networkKeyFlagsArray = [
  NetworkKeyFlagsValues.AUTH,
  NetworkKeyFlagsValues.SET_FEATURES,
  NetworkKeyFlagsValues.CREATE_GATEKEEPER,
  NetworkKeyFlagsValues.FREEZE_GATEKEEPER,
  NetworkKeyFlagsValues.UNFREEZE_GATEKEEPER,
  NetworkKeyFlagsValues.HALT_GATEKEEPER,
  NetworkKeyFlagsValues.UNHALT_GATEKEEPER,
  NetworkKeyFlagsValues.UNREVOKE_PASS,
  NetworkKeyFlagsValues.ADJUST_FEES,
  NetworkKeyFlagsValues.ADD_FEES,
  NetworkKeyFlagsValues.ACCESS_VAULT,
];

export class NetworkKeyFlags implements Serialize {
  constructor(public value: u16) {}
  write(buffer: Buffer, offset: { offset: number }): void {
    this.value.write(buffer, offset);
  }
  serializedSize(): number {
    return this.value.serializedSize();
  }

  static size(): number {
    return 2;
  }

  static read(buffer: Buffer, offset: { offset: number }): NetworkKeyFlags {
    const value = u16.read(buffer, offset);
    return new NetworkKeyFlags(value);
  }

  hasFlag(flag: NetworkKeyFlagsValues): boolean {
    return (this.value.value & flag) === flag;
  }

  toFlagsArray(): NetworkKeyFlagsValues[] {
    const flags: NetworkKeyFlagsValues[] = [];
    for (const flag of networkKeyFlagsArray) {
      if (this.hasFlag(flag)) {
        flags.push(flag);
      }
    }
    return flags;
  }

  static fromFlagsArray(
    networkKeyFlagsValues: NetworkKeyFlagsValues[]
  ): NetworkKeyFlags {
    let out = 0;
    for (const flag of networkKeyFlagsValues) {
      out = out | flag;
    }
    return new NetworkKeyFlags(new u16(out));
  }
}

const maxNetworkFees = 128;
const maxAuthKeys = 128;
export class NetworkAuthKey implements Serialize {
  constructor(public flags: NetworkKeyFlags, public key: PublicKey) {}
  write(buffer: Buffer, offset: { offset: number }): void {
    this.flags.write(buffer, offset);
    new SerializablePublicKey(this.key).write(buffer, offset);
  }
  serializedSize(): number {
    return (
      this.flags.serializedSize() +
      new SerializablePublicKey(this.key).serializedSize()
    );
  }

  static read(buffer: Buffer, offset: { offset: number }): NetworkAuthKey {
    const flags = NetworkKeyFlags.read(buffer, offset);
    const key = readPublicKey(buffer, offset);
    return new NetworkAuthKey(flags, key);
  }

  static size(): number {
    return NetworkKeyFlags.size() + 32;
  }
}

export class GatekeeperNetwork {
  constructor(
    public version: u8,
    public networkFeatures: u8[][],
    public authThreshold: u8,
    public passExpireTime: i64,
    public networkDataLength: u16,
    public signerBump: u8,
    public fees: NetworkFees[],
    public authKeys: NetworkAuthKey[]
  ) {}

  static read(buffer: Buffer, offset: { offset: number }): GatekeeperNetwork {
    const version = u8.read(buffer, offset);
    const networkFeatures = readArray(buffer, offset, 128, (buffer, offset) => {
      return readArray(buffer, offset, 32, (buffer, offset) => {
        return u8.read(buffer, offset);
      });
    });
    const authThreshold = u8.read(buffer, offset);
    const passExpireTime = i64.read(buffer, offset);
    const networkDataLength = u16.read(buffer, offset);
    const signerBump = u8.read(buffer, offset);
    const feesCount = u16.read(buffer, offset);
    const authKeysCount = u16.read(buffer, offset);
    const fees = readArray(
      buffer,
      { offset: offset.offset },
      feesCount.value,
      NetworkFees.read
    );
    offset.offset += maxNetworkFees * NetworkFees.size();
    const authKeys = readArray(
      buffer,
      { offset: offset.offset },
      authKeysCount.value,
      NetworkAuthKey.read
    );
    offset.offset += maxAuthKeys * NetworkAuthKey.size();

    return new GatekeeperNetwork(
      version,
      networkFeatures,
      authThreshold,
      passExpireTime,
      networkDataLength,
      signerBump,
      fees,
      authKeys
    );
  }
}

export async function getNetworkAccount(
  connection: Connection,
  key: PublicKey
): Promise<GatekeeperNetwork | null> {
  const info = await connection.getAccountInfo(key);
  if (!info) {
    return null;
  }
  if (info.data.at(0) !== 1) {
    return null;
  }
  return GatekeeperNetwork.read(info.data, { offset: 1 });
}
