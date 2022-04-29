import {Connection, PublicKey} from '@solana/web3.js';

function readPublicKey(buffer: Buffer, offset: { offset: number }): PublicKey {
  const public_key = new PublicKey(buffer.slice(offset.offset, offset.offset + 32));
  offset.offset += 32;
  return public_key;
}

function readArray<T>(
  buffer: Buffer,
  offset: { offset: number },
  length: number,
  readInner: (buffer: Buffer, offset: { offset: number }) => T,
): T[] {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(readInner(buffer, offset));
  }
  return result;
}

class u8 {
  constructor(public value: number) {}
  static read(buffer: Buffer, offset: { offset: number }): u8 {
    const value = buffer.readUInt8(offset.offset);
    offset.offset += 1;
    return new u8(value);
  }
}
class u16{
  constructor(public value: number){}
  static read(buffer: Buffer, offset: { offset: number }): u16{
    const value = buffer.readUInt16LE(offset.offset);
    offset.offset += 2;
    return new u16(value);
  }
}
class u32{
  constructor(public value: number){}
  static read(buffer: Buffer, offset: { offset: number }): u32{
    const value = buffer.readUInt32LE(offset.offset);
    offset.offset += 4;
    return new u32(value);
  }
}
class u64 {
  constructor(public value: bigint) {
  }
  static read(buffer: Buffer, offset: { offset: number }): u64 {
    const value = buffer.readBigUInt64LE(offset.offset);
    offset.offset += 8;
    return new u64(value);
  }
}
class i64 {
  constructor(public value: bigint) {}
  static read(buffer: Buffer, offset: { offset: number }): i64 {
    const value = buffer.readBigInt64LE(offset.offset);
    offset.offset += 8;
    return new i64(value);
  }
}

class NetworkFees{
  constructor(
    public token: PublicKey,
    public issue: u16,
    public refresh: u16,
    public expire: u16,
    public verify: u16,
  ){}

  static size(): number{
    return 32 + 4 * 2;
  }
  static read(buffer: Buffer, offset: { offset: number }): NetworkFees{
    const token = readPublicKey(buffer, offset);
    const issue = u16.read(buffer, offset);
    const refresh = u16.read(buffer, offset);
    const expire = u16.read(buffer, offset);
    const verify = u16.read(buffer, offset);

    return new NetworkFees(token, issue, refresh, expire, verify);
  }
}

function roundToNext(x: number, multiple: number): number{
  return (x + multiple - 1) / multiple * multiple;
}

enum NetworkKeyFlagsValues{
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
const networkKeyFlagsArray = [
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

class NetworkKeyFlags{
  constructor(public value: u16){}

  static size(): number{
    return 2;
  }

  static read(buffer: Buffer, offset: { offset: number }): NetworkKeyFlags{
    const value = u16.read(buffer, offset);
    return new NetworkKeyFlags(value);
  }

  hasFlag(flag: NetworkKeyFlagsValues): boolean{
    return (this.value.value & flag) === flag;
  }

  toFlagsArray(): NetworkKeyFlagsValues[]{
    const flags: NetworkKeyFlagsValues[] = [];
    for(const flag of networkKeyFlagsArray){
      if(this.hasFlag(flag)){
        flags.push(flag);
      }
    }
    return flags;
  }
}


class GatekeeperNetwork{
  constructor(
    public version: u8,
    public networkFeatures: u8[][],
    public authThreshold: u8,
    public passExpireTime: i64,
    public networkDataLength: u16,
    public signerBump: u8,
    public fees: NetworkFees[],
    public authKeys: [NetworkKeyFlags, PublicKey][],
  ) {}

  static read(buffer: Buffer, offset: { offset: number }): GatekeeperNetwork{
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
    const startOffset = offset.offset;
    const fees = readArray(buffer, offset, feesCount.value, NetworkFees.read);
    const authKeysOffset = roundToNext(startOffset + feesCount.value * NetworkFees.size(), NetworkKeyFlags.size() + 32);
    const authKeys: [NetworkKeyFlags, PublicKey][] = readArray(buffer, { offset: authKeysOffset }, authKeysCount.value, (buffer, offset) => {
      const flags = NetworkKeyFlags.read(buffer, offset);
      const key = readPublicKey(buffer, offset);
      return [flags, key];
    });

    return new GatekeeperNetwork(
      version,
      networkFeatures,
      authThreshold,
      passExpireTime,
      networkDataLength,
      signerBump,
      fees,
      authKeys,
    );
  }
}


async function getNetworkAccount(connection: Connection, key: PublicKey): GatekeeperNetwork{
  const info = await connection.getAccountInfo(key);
  return GatekeeperNetwork.read(info.data, { offset: 0 });
}
