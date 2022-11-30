// import * as anchor from '@project-serum/anchor';
// import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// import { exec as execCB } from 'child_process';
// import * as util from 'util';
// import {
//   airdrop,
//   AdminService,
//   NetworkService,
//   GatekeeperKeyFlags,
// } from '@identity.com/gateway-solana-client';
// import { createMint } from '@solana/spl-token';
// import * as fs from 'fs';
// import { setGatekeeperFlagsAndFees } from '../src/util/lib';
// import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
// import {
//   TEST_ALT_GATEKEEPER,
//   TEST_ALT_NETWORK,
//   TEST_GATEKEEPER,
//   TEST_GUARDIAN,
//   TEST_MINT,
//   TEST_NETWORK,
// } from '../src/util/constants';

// const exec = util.promisify(execCB);

// const accountsFixturePath = './packages/tests/fixtures/accounts';
// const keypairsFixturePath = './packages/tests/fixtures/keypairs';

// anchor.setProvider(anchor.AnchorProvider.env());
// const program = anchor.workspace
//   .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
// const programProvider = program.provider as anchor.AnchorProvider;

// const saveAccountToFile = async (publicKeyBase58: string, filename: string) => {
//   return exec(
//     `solana account ${publicKeyBase58} -ul -o ${accountsFixturePath}/${filename}.json --output json`
//   );
// };

// /**
//  * Loads a keypair from file in the fixtures, and optionally airdrop
//  *
//  * @param publicKeyBase58 The public key of the keypair to load
//  * @param airdropAmount The amount to airdrop
//  */
// const loadKeypair = async (
//   publicKeyBase58: string,
//   airdropAmount = 0
// ): Promise<Keypair> => {
//   const filename = `${keypairsFixturePath}/${publicKeyBase58}.json`;

//   const keypair = Keypair.fromSecretKey(
//     new Uint8Array(JSON.parse(fs.readFileSync(filename).toString()))
//   );

//   if (airdropAmount > 0) {
//     await airdrop(programProvider.connection, keypair.publicKey, airdropAmount);
//   }

//   return keypair;
// };

// const accountExists = async (account: PublicKey) =>
//   (await programProvider.connection.getAccountInfo(account, 'confirmed')) !==
//   null;

// const createTestTokenAccount = async () => {
//   // Create and save the mint authority
//   const mintAuthority = await loadKeypair(
//     '9SkxBuj9kuaJQ3yAXEuRESjYt14BcPUTac25Mbi1n8ny',
//     LAMPORTS_PER_SOL
//   );
//   await saveAccountToFile(mintAuthority.publicKey.toBase58(), 'mint-authority');

//   const mintAccount = await loadKeypair(
//     'wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtveqn4esJGX'
//   );

//   if (!(await accountExists(mintAccount.publicKey))) {
//     // Create and save the mint
//     await createMint(
//       programProvider.connection,
//       mintAuthority,
//       mintAuthority.publicKey,
//       null,
//       0,
//       mintAccount
//     );
//   }

//   await saveAccountToFile(mintAccount.publicKey.toBase58(), 'mint-account');

//   console.log(
//     `Created mint account ${mintAccount.publicKey.toBase58()} for mint authority ${mintAuthority.publicKey.toBase58()}`
//   );
// };

// const createNetworkAccount = async (
//   authorityBase58: string,
//   filename: string
// ): Promise<PublicKey> => {
//   const authorityKeypair = await loadKeypair(authorityBase58);
//   const authority = new anchor.Wallet(authorityKeypair);
//   const guardian = new anchor.Wallet(
//     await loadKeypair(TEST_GUARDIAN.toBase58(), LAMPORTS_PER_SOL)
//   );

//   const service = await AdminService.buildFromAnchor(
//     program,
//     authority.publicKey,
//     {
//       clusterType: 'localnet',
//       wallet: guardian,
//     }
//   );

//   const foundAccount = await service.getNetworkAccount();

//   if (!foundAccount) {
//     await service.createNetwork().withPartialSigners(authorityKeypair).rpc();

//     await airdrop(
//       programProvider.connection,
//       authorityKeypair.publicKey,
//       LAMPORTS_PER_SOL
//     );
//   }

//   const authBase58 = authority.publicKey.toBase58();

//   await saveAccountToFile(authBase58, filename);

//   console.log(`Created Network ${authBase58}`);

//   return authority.publicKey;
// };

// const createGatekeeperAccount = async (
//   network: PublicKey,
//   authorityBase58: string,
//   filename: string
// ) => {
//   const authorityKeypair = await loadKeypair(authorityBase58, LAMPORTS_PER_SOL);
//   const authority = new anchor.Wallet(authorityKeypair);

//   await airdrop(
//     programProvider.connection,
//     authority.publicKey,
//     LAMPORTS_PER_SOL * 2
//   );

//   await airdrop(programProvider.connection, network, LAMPORTS_PER_SOL * 2);

//   const [dataAccount] = await NetworkService.createGatekeeperAddress(
//     authority.publicKey,
//     network
//   );

//   const [stakingDataAccount] = await NetworkService.createStakingAddress(
//     authorityKeypair.publicKey
//   );

//   const service = await NetworkService.buildFromAnchor(
//     program,
//     authority.publicKey,
//     dataAccount,
//     {
//       clusterType: 'localnet',
//       wallet: authority,
//     }
//   );

//   const foundAccount = await service.getGatekeeperAccount();

//   if (!foundAccount) {
//     console.log(
//       `Creating data account ${dataAccount.toBase58()} with staking account: ${stakingDataAccount}`
//     );

//     const kp = Keypair.generate();
//     await airdrop(programProvider.connection, kp.publicKey, LAMPORTS_PER_SOL);

//     await service
//       .createGatekeeper(network, stakingDataAccount, undefined, {
//         tokenFees: [],
//         authThreshold: 1,
//         authKeys: [
//           {
//             flags: GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.ISSUE,
//             key: authorityKeypair.publicKey,
//           },
//         ],
//       })
//       .rpc();
//     await setGatekeeperFlagsAndFees(stakingDataAccount, service, 65535, [
//       {
//         token: TEST_MINT,
//         issue: new anchor.BN(1),
//         refresh: new anchor.BN(1),
//         expire: new anchor.BN(1),
//         verify: new anchor.BN(1),
//       },
//     ]);
//   }

//   await saveAccountToFile(dataAccount.toBase58(), filename);

//   console.log(
//     `Created Gatekeeper ${dataAccount.toBase58()} with authority ${authorityBase58}`
//   );
// };

// (async () => {
//   // Create the main network account to be used in tests
//   const networkAccount = await createNetworkAccount(
//     TEST_NETWORK.toBase58(),
//     'network'
//   );

//   // Create an alternative network account to be used in tests
//   const altNetworkAccount = await createNetworkAccount(
//     TEST_ALT_NETWORK.toBase58(),
//     'network-alt'
//   );

//   // Create the main gatekeeper in the main network for tests
//   await createGatekeeperAccount(
//     networkAccount,
//     TEST_GATEKEEPER.toBase58(),
//     'gatekeeper'
//   );
//   // Create an alternative gatekeeper in the main network for tests
//   await createGatekeeperAccount(
//     networkAccount,
//     TEST_ALT_GATEKEEPER.toBase58(),
//     'gatekeeper-alt'
//   );

//   // Create a gatekeeper in an alternative network for tests
//   await createGatekeeperAccount(
//     altNetworkAccount,
//     TEST_ALT_GATEKEEPER.toBase58(),
//     'gatekeeper-invalid'
//   );

//   // Create a mint account for testing
//   await createTestTokenAccount();
// })().catch(console.error);
