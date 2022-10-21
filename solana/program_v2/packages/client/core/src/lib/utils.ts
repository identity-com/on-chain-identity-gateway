import { PublicKey } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';

import { GATEWAY_PROGRAM } from './constants';
import { PassState } from './wrappers';

export const airdrop = async (
  connection: web3.Connection,
  account: web3.PublicKey,
  amount = anchor.web3.LAMPORTS_PER_SOL
): Promise<void> => {
  const sigAirdrop = await connection.requestAirdrop(account, amount);
  const latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    signature: sigAirdrop,
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  });
};

// TODO: Fix enum mapping by changing the Pass/GK State to be bitflags program-side

type EnumMapping = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
};

type EnumType = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [name: string]: {};
};

export const EnumMapper = {
  /**
   * Converts an anchor "enum" to a local enum
   * @param obj The anchor enum object
   * @param mapping The enum to maps it to
   */
  from(obj: Record<string, unknown>, mapping: EnumMapping): PassState {
    for (const property in mapping) {
      if (property in obj) return mapping[property];
    }

    throw new Error(`Invalid enum ${JSON.stringify(obj)}`);
  },

  to(type: unknown, mapping: EnumMapping): EnumType {
    for (const property in mapping) {
      if (type == mapping[property]) {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const obj: { [k: string]: {} } = {};
        obj[property] = {};
        return obj;
      }
    }

    throw new Error(`Invalid num type ${type}`);
  },
};

export const findProgramAddress = async (
  seed: string,
  authority: PublicKey
): Promise<[PublicKey, number]> =>
  PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(seed), authority.toBuffer()],
    GATEWAY_PROGRAM
  );