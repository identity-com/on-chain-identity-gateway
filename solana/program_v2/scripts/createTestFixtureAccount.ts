import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { exec as execCB } from 'child_process';
import * as util from 'util';
import { GatewayV2 } from '../target/types/gateway_v2';
import { airdrop } from '../src/lib/utils';
import { GATEWAY_PROGRAM } from '../src/lib/constants';
const exec = util.promisify(execCB);

const fixturePath = './tests/fixtures/accounts/';

//copied from anchor
export async function idlAddress(programId: PublicKey): Promise<PublicKey> {
  const base = (await PublicKey.findProgramAddress([], programId))[0];
  return await PublicKey.createWithSeed(base, 'anchor:idl', programId);
}

(async () => {
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  const authority = programProvider.wallet;

  await airdrop(
    programProvider.connection,
    authority.publicKey,
    100 * anchor.web3.LAMPORTS_PER_SOL
  );

  console.log(
    `anchor idl init --filepath ./target/idl/gateway_v2.json ${GATEWAY_PROGRAM}`
  );
  console.log('Deploying IDL');
  // Deploy IDL
  await exec(
    `anchor idl init --filepath ./target/idl/gateway_v2.json ${GATEWAY_PROGRAM}`
  );

  // write account
  const idlAddr = await idlAddress(GATEWAY_PROGRAM);
  console.log(`Done deploying IDL at ${idlAddr.toBase58()}`);

  await exec(
    `solana account ${idlAddr.toBase58()} -ul -o ${fixturePath}idl-account.json --output json`
  );
})().catch(console.error);
