import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
} from '@solana/web3.js';
import {
  AdminService,
  airdrop,
  GatekeeperService,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { Account } from '@solana/spl-token/src/state/account';
import { setGatekeeperFlagsAndFees } from './util/lib';

export const setUpAdminNetworkGatekeeper = async (
  program: anchor.Program<SolanaAnchorGateway>,
  programProvider: anchor.AnchorProvider
) => {
  const adminAuthority = Keypair.generate();
  const networkAuthority = Keypair.generate();
  const gatekeeperAuthority = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const subject = Keypair.generate();
  const mintAccount = Keypair.generate();

  // Airdrops
  await airdrop(
    programProvider.connection,
    adminAuthority.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await airdrop(
    programProvider.connection,
    networkAuthority.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await airdrop(
    programProvider.connection,
    gatekeeperAuthority.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await airdrop(
    programProvider.connection,
    mintAuthority.publicKey,
    LAMPORTS_PER_SOL * 2
  );

  const mint = await createMint(
    programProvider.connection,
    mintAuthority,
    mintAuthority.publicKey,
    null,
    0,
    mintAccount
  );

  const [gatekeeperPDA] = await NetworkService.createGatekeeperAddress(
    gatekeeperAuthority.publicKey,
    networkAuthority.publicKey
  );

  const [stakingPDA] = await NetworkService.createStakingAddress(
    gatekeeperAuthority.publicKey
  );

  const adminService = await AdminService.buildFromAnchor(
    program,
    networkAuthority.publicKey,
    {
      clusterType: 'localnet',
      wallet: new anchor.Wallet(adminAuthority),
    },
    programProvider
  );

  const networkService = await NetworkService.buildFromAnchor(
    program,
    gatekeeperAuthority.publicKey,
    gatekeeperPDA,
    {
      clusterType: 'localnet',
      wallet: new anchor.Wallet(gatekeeperAuthority),
    },
    programProvider
  );

  await adminService
    .createNetwork({
      authThreshold: 1,
      passExpireTime: 10000,
      fees: [
        {
          token: mint,
          issue: new anchor.BN(10),
          refresh: new anchor.BN(10),
          expire: new anchor.BN(10),
          verify: new anchor.BN(10),
        },
      ],
      authKeys: [{ flags: 4097, key: networkAuthority.publicKey }],
      supportedTokens: [],
    })
    .withPartialSigners(networkAuthority)
    .rpc();

  await networkService
    .createGatekeeper(
      networkAuthority.publicKey,
      stakingPDA,
      adminAuthority.publicKey
    )
    .withPartialSigners(adminAuthority)
    .rpc();

  await setGatekeeperFlagsAndFees(stakingPDA, networkService, 65535, [
    {
      token: mint,
      issue: new anchor.BN(1000),
      refresh: new anchor.BN(1000),
      expire: new anchor.BN(1000),
      verify: new anchor.BN(1000),
    },
  ]);

  const passAccount = await GatekeeperService.createPassAddress(
    subject.publicKey,
    networkAuthority.publicKey
  );

  // Airdrop to passAccount
  await airdrop(programProvider.connection, passAccount, LAMPORTS_PER_SOL * 2);

  const gatekeeperService = await GatekeeperService.buildFromAnchor(
    program,
    networkAuthority.publicKey,
    gatekeeperPDA,
    {
      clusterType: 'localnet',
      wallet: new anchor.Wallet(gatekeeperAuthority),
    }
  );
  return {
    adminService,
    networkService,
    gatekeeperService,
    gatekeeperPDA,
    stakingPDA,
    passAccount,
    mint,
    adminAuthority,
    networkAuthority,
    gatekeeperAuthority,
    mintAuthority,
    subject,
    mintAccount,
  };
};

export const makeAssociatedTokenAccountsForIssue = async (
  connection: Connection,
  adminAuthority: Signer,
  mintAuthority: Signer,
  networkPublicKey: PublicKey,
  gatekeeperPublicKey: PublicKey,
  mintPublicKey: PublicKey,
  gatekeeperPDA: PublicKey,
  funderMintAmount = 2000
): Promise<{
  gatekeeperAta: Account;
  networkAta: Account;
  funderAta: Account;
  funderKeypair: Keypair;
}> => {
  const funderKeypair = Keypair.generate();
  await airdrop(connection, funderKeypair.publicKey);

  const gatekeeperAta = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAuthority,
    mintPublicKey,
    gatekeeperPDA,
    true
  );

  const networkAta = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAuthority,
    mintPublicKey,
    adminAuthority.publicKey,
    false
  );

  const funderAta = await getOrCreateAssociatedTokenAccount(
    connection,
    adminAuthority,
    mintPublicKey,
    funderKeypair.publicKey,
    true
  );

  await mintTo(
    connection,
    funderKeypair,
    mintPublicKey,
    funderAta.address,
    mintAuthority,
    funderMintAmount
  );

  return {
    gatekeeperAta,
    networkAta,
    funderAta,
    funderKeypair,
  };
};
