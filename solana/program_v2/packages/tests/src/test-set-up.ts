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
  NetworkKeyFlags,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import * as anchor from '@coral-xyz/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { Account } from '@solana/spl-token/src/state/account';
import { generateFundedKey, setGatekeeperFlagsAndFees } from './util/lib';
import { NetworkFeatures } from '@identity.com/gateway-solana-client/dist/lib/constants';

export const setUpAdminNetworkGatekeeper = async (
  program: anchor.Program<SolanaAnchorGateway>,
  programProvider: anchor.AnchorProvider
): Promise<{
  adminService: AdminService;
  networkService: NetworkService;
  gatekeeperService: GatekeeperService;
  gatekeeperPDA: PublicKey;
  stakingPDA: PublicKey;
  passAccount: PublicKey;
  mint: PublicKey;
  adminAuthority: Keypair;
  networkAuthority: Keypair;
  gatekeeperAuthority: Keypair;
  mintAuthority: Keypair;
  subject: Keypair;
  mintAccount: Keypair;
}> => {
  const adminAuthority = await generateFundedKey();
  const networkAuthority = await generateFundedKey();
  const gatekeeperAuthority = await generateFundedKey();
  const mintAuthority = await generateFundedKey();
  const subject = Keypair.generate();
  const mintAccount = Keypair.generate();

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
          issue: 10,
          refresh: 10,
          expire: 10,
          verify: 10,
        },
      ],
      authKeys: [
        { flags: NetworkKeyFlags.AUTH, key: gatekeeperAuthority.publicKey },
      ],
      supportedTokens: [{ key: mint }],
      networkFeatures: NetworkFeatures.CHANGE_PASS_GATEKEEPER,
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
      issue: 1000,
      refresh: 1000,
      expire: 1000,
      verify: 1000,
    },
  ]);

  const passAccount = await GatekeeperService.createPassAddress(
    subject.publicKey,
    networkAuthority.publicKey
  );

  // Airdrop to passAccount
  await airdrop(programProvider.connection, passAccount, LAMPORTS_PER_SOL);

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
  const funderKeypair = await generateFundedKey();

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
    networkPublicKey,
    true
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
