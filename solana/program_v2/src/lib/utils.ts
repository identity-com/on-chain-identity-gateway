import { PublicKey } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';

import { DEFAULT_SEED_STRING, GATEWAY_PROGRAM } from './constants';

export const airdrop = async (
  connection: web3.Connection,
  account: web3.PublicKey,
  amount = anchor.web3.LAMPORTS_PER_SOL
) => {
  const sigAirdrop = await connection.requestAirdrop(account, amount);
  const latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    signature: sigAirdrop,
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  });
};

export const findProgramAddress = async (
  authority: PublicKey,
  network_index: number
) => {
  const network_index_buffer = Buffer.alloc(2);
  network_index_buffer.writeInt16LE(network_index);

  return PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode(DEFAULT_SEED_STRING),
      authority.toBuffer(),
      network_index_buffer,
    ],
    GATEWAY_PROGRAM
  );
};
