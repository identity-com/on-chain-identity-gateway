import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  u8,
  i64,
  u16,
  NetworkFees,
  NetworkAuthKey,
  serializeArray,
} from "./state";

export class NetworkData {
  constructor(
    public authThreshold: u8,
    public passExpireTime: i64,
    public networkDataLen: u16,
    public signerBump: u8,
    public fees: NetworkFees[],
    public authKeys: NetworkAuthKey[]
  ) {}

  size(): number {
    return (
      8 +
      64 +
      16 +
      8 +
      (1 + NetworkFees.size() * this.fees.length) +
      (1 + NetworkAuthKey.size() * this.authKeys.length)
    );
  }

  write(buffer: Buffer, offset: { offset: number }) {
    this.authThreshold.write(buffer, offset);
    this.passExpireTime.write(buffer, offset);
    this.networkDataLen.write(buffer, offset);
    this.signerBump.write(buffer, offset);
    serializeArray(this.fees, u8, buffer, offset);
    serializeArray(this.authKeys, u8, buffer, offset);
  }
}

export const createNetwork = async (
  programId: PublicKey,
  network: Keypair,
  funder: Keypair,
  networkData: NetworkData
): Promise<TransactionInstruction[]> => {
  const create = SystemProgram.createAccount({
    fromPubkey: funder.publicKey,
    newAccountPubkey: network.publicKey,
    lamports: LAMPORTS_PER_SOL,
    space: 15_000,
    programId: programId,
  });

  const [networkSigner, signerBump] = await PublicKey.findProgramAddress(
    [Buffer.from("network"), network.publicKey.toBuffer()],
    programId
  );
  networkData.signerBump = new u8(signerBump);
  const data = Buffer.alloc(u8.staticSize() + networkData.size());
  const offset = { offset: 0 };
  new u8(0).write(data, offset);
  networkData.write(data, offset);
  let createNetwork = new TransactionInstruction({
    keys: [
      { pubkey: network.publicKey, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: networkSigner, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });

  return [create, createNetwork];
};
