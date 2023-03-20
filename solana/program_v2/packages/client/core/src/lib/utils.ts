import { ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';

import { GATEWAY_PROGRAM } from './constants';
import { PassAccount, PassState } from './wrappers';
import { AbstractService, NonSigningWallet } from '../utils/AbstractService';
import { GatekeeperService } from '../GatekeeperService';
import { RawPassAccount } from './types';

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
   *
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

/**
 * Finds a gateway pass for a given subject
 *
 * @param connection The Solana connection to use
 * @param gatekeeperNetwork The gatekeeper network the pass is in
 * @param subject The address for the subject the pass belongs to
 * @param passNumber The pass number if more than one pass is issued
 */
export const findGatewayPass = async (
  connection: Connection,
  gatekeeperNetwork: PublicKey,
  subject: PublicKey,
  passNumber = 0
): Promise<PassAccount | null> => {
  const address = await GatekeeperService.createPassAddress(
    subject,
    gatekeeperNetwork,
    passNumber
  );

  return findGatewayTokenByAccount(connection, gatekeeperNetwork, address);
};

export const findGatewayTokenByAccount = async (
  connection: Connection,
  gatekeeperNetwork: PublicKey,
  passAccount: PublicKey,
  opts: ConfirmOptions = AnchorProvider.defaultOptions()
): Promise<PassAccount | null> => {
  const provider = new AnchorProvider(connection, new NonSigningWallet(), opts);
  const program = await AbstractService.fetchProgram(provider);

  const acct = await program.account.pass
    .fetchNullable(passAccount)
    .then(PassAccount.from);
  if (!acct) {
    return null;
  }
  if (acct.state !== 0) {
    return null;
  }
  if (acct.network.toBase58() !== gatekeeperNetwork.toBase58()) {
    return null;
  }
  return acct;
};

/**
 * Fires an event when a gateway pass is issued or updated
 *
 * @param connection The Solana connection to use
 * @param gatekeeperNetwork The gatekeeper network the pass is in
 * @param subject The address for the subject the pass belongs to
 * @param passNumber The pass number if more than one pass is issued
 * @param callback The function called when the pass is issued or updated
 * @param opts The Solana confirm options to use
 */
export const onGatewayPass = async (
  connection: Connection,
  gatekeeperNetwork: PublicKey,
  subject: PublicKey,
  passNumber = 0,
  callback: (pass: PassAccount) => void,
  opts: ConfirmOptions = AnchorProvider.defaultOptions()
): Promise<number> => {
  const provider = new AnchorProvider(connection, new NonSigningWallet(), opts);
  const program = await AbstractService.fetchProgram(provider);

  const address = await GatekeeperService.createPassAddress(
    subject,
    gatekeeperNetwork,
    passNumber
  );

  return connection.onAccountChange(
    address,
    async (accountInfo: anchor.web3.AccountInfo<Buffer>) => {
      // Manually deserialize from the account info
      const rawAccount: RawPassAccount = program.coder.accounts.decode(
        'pass',
        accountInfo.data
      );

      const pass = PassAccount.from(rawAccount);

      if (pass) callback(pass);
    },
    opts.commitment
  );
};
