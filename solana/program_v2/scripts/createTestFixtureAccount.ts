import * as anchor from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { exec as execCB } from 'child_process';
import * as util from 'util';
import { GatewayV2 } from '../target/types/gateway_v2';
import { airdrop } from '@identity.com/gateway-solana-client/src/lib/utils';
import { AdminService } from '@identity.com/gateway-solana-client/src/AdminService';
import { NetworkService } from '@identity.com/gateway-solana-client/src/NetworkService';
import { createMint } from '@solana/spl-token';
import * as fs from 'fs';
import { setGatekeeperFlags } from '../packages/tests/src/util/lib';

const exec = util.promisify(execCB);

const accountsFixturePath = './tests/fixtures/accounts';
const keypairsFixturePath = './tests/fixtures/keypairs';

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
const programProvider = program.provider as anchor.AnchorProvider;

//copied from anchor
export async function idlAddress(programId: PublicKey): Promise<PublicKey> {
  const base = (await PublicKey.findProgramAddress([], programId))[0];
  return await PublicKey.createWithSeed(base, 'anchor:idl', programId);
}

const saveAccountToFile = async (publicKeyBase58: string, filename: string) => {
  return exec(
    `solana account ${publicKeyBase58} -ul -o ${accountsFixturePath}/${filename}.json --output json`
  );
};

/**
 * Loads a keypair from file in the fixtures, and optionally airdrop
 *
 * @param publicKey The public key of the keypair to load
 * @param airdrop The amount to airdrop
 */
const loadKeypair = async (
  publicKeyBase58: string,
  airdropAmount = 0
): Promise<Keypair> => {
  const filename = `${keypairsFixturePath}/${publicKeyBase58}.json`;

  const keypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(filename).toString()))
  );

  if (airdropAmount > 0) {
    await airdrop(programProvider.connection, keypair.publicKey, airdropAmount);
  }

  return keypair;
};

const accountExists = async (account: PublicKey) =>
  (await programProvider.connection.getAccountInfo(account, 'confirmed')) !==
  null;

const createTestTokenAccount = async () => {
  // Create and save the mint authority
  const mintAuthority = await loadKeypair(
    '9SkxBuj9kuaJQ3yAXEuRESjYt14BcPUTac25Mbi1n8ny',
    LAMPORTS_PER_SOL
  );
  await saveAccountToFile(mintAuthority.publicKey.toBase58(), 'mint-authority');

  const mintAccount = await loadKeypair(
    'wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtveqn4esJGX'
  );

  if (!(await accountExists(mintAccount.publicKey))) {
    // Create and save the mint
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mint = await createMint(
      programProvider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      0,
      mintAccount
    );
  }

  await saveAccountToFile(mintAccount.publicKey.toBase58(), 'mint-account');

  console.log(
    `Created mint account ${mintAccount.publicKey.toBase58()} for mint authority ${mintAuthority.publicKey.toBase58()}`
  );
};

const createNetworkAccount = async (
  authorityBase58: string,
  filename: string
) => {
  const authorityKeypair = await loadKeypair(authorityBase58, LAMPORTS_PER_SOL);
  const authority = new anchor.Wallet(authorityKeypair);

  const [dataAccount] = await AdminService.createNetworkAddress(
    authority.publicKey
  );

  const service = await AdminService.buildFromAnchor(
    program,
    dataAccount,
    'localnet',
    programProvider,
    authority
  );

  const foundAccount = await service.getNetworkAccount();

  if (!foundAccount) {
    await service.createNetwork().rpc();
  }

  await saveAccountToFile(dataAccount.toBase58(), filename);

  console.log(`Created Network ${dataAccount.toBase58()}`);

  return dataAccount;
};

const createGatekeeperAccount = async (
  network: PublicKey,
  authorityBase58: string,
  filename: string
) => {
  const authorityKeypair = await loadKeypair(authorityBase58, LAMPORTS_PER_SOL);
  const authority = new anchor.Wallet(authorityKeypair);

  await airdrop(
    programProvider.connection,
    authority.publicKey,
    LAMPORTS_PER_SOL * 2
  );

  const [networkDataAccount] = await AdminService.createNetworkAddress(network);

  const [dataAccount] = await NetworkService.createGatekeeperAddress(
    authority.publicKey,
    network
  );

  const [stakingDataAccount] = await NetworkService.createStakingAddress(
    networkDataAccount
  );

  const service = await NetworkService.buildFromAnchor(
    program,
    authority.publicKey,
    dataAccount,
    'localnet',
    programProvider,
    authority
  );

  const foundAccount = await service.getGatekeeperAccount();

  if (!foundAccount) {
    console.log(
      'Creating data account with staking acccount: ' + stakingDataAccount
    );

    await service
      .createGatekeeper(
        network,
        stakingDataAccount,
        undefined,
        authority.publicKey
      )
      .rpc();

    await setGatekeeperFlags(stakingDataAccount, service, 65535);
  }

  await saveAccountToFile(dataAccount.toBase58(), filename);

  console.log(
    `Created Gatekeeper ${dataAccount.toBase58()} with authority ${authorityBase58}`
  );
};

(async () => {
  // Create the main network account to be used in tests
  const networkAccount = await createNetworkAccount(
    'B4951ZxztgHL98WT4eFUyaaRmsi6V4hBzkoYe1VSNweo',
    'network'
  );

  // Create an alternative network account to be used in tests
  const altNetworkAccount = await createNetworkAccount(
    'DuqrwqMDuVwgd2BNbCFQS5gwNuZcfgjuL6KpuvjGjaYa',
    'network-alt'
  );

  // Create the main gatekeeper in the main network for tests
  const gatekeeperAccount = await createGatekeeperAccount(
    networkAccount,
    'B4951ZxztgHL98WT4eFUyaaRmsi6V4hBzkoYe1VSNweo',
    'gatekeeper'
  );

  // Create an alternative gatekeeper in the main network for tests
  const altGatekeeperAccount = await createGatekeeperAccount(
    networkAccount,
    'DuqrwqMDuVwgd2BNbCFQS5gwNuZcfgjuL6KpuvjGjaYa',
    'gatekeeper-alt'
  );

  // Create a gatekeeper in an alternative network for tests
  const invalidGatekeeperAccount = await createGatekeeperAccount(
    altNetworkAccount,
    '6ufu3BBssTiNhQ5ejtkNGfqksXQatAZ5aVFVPNQy8wu9',
    'gatekeeper-invalid'
  );

  // Create a mint account for testing
  await createTestTokenAccount();
})().catch(console.error);
