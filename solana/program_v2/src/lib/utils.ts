import { PublicKey } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';

import { GATEKEEPER_SEED, GATEWAY_PROGRAM } from './constants';

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

type EnumMapping = {
  [name: string]: any;
};

type EnumType = {
  [name: string]: {};
};

export const EnumMapper = {
  /**
   * Converts an anchor "enum" to a local enum
   * @param obj The anchor enum object
   * @param mapping The enum to maps it to
   */
  from(obj: EnumType, mapping: EnumMapping) {
    for (const property in mapping) {
      if (property in obj) return mapping[property];
    }

    throw new Error(`Invalid enum ${JSON.stringify(obj)}`);
  },

  to(type: any, mapping: EnumMapping) {
    for (const property in mapping) {
      if (type == mapping[property]) {
        const obj: { [k: string]: {} } = {};
        obj[property] = {};
        return obj;
      }
    }

    throw new Error(`Invalid num type ${type}`);
  },
};

export const findProgramAddress = async (seed: string, authority: PublicKey) =>
  PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(seed), authority.toBuffer()],
    GATEWAY_PROGRAM
  );
};
