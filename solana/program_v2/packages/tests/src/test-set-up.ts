import { Keypair } from '@solana/web3.js';
import {
  AdminService,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import * as anchor from '@project-serum/anchor';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';

export const setUpAdminNetworkGatekeeper = async (
  adminAuthority: Keypair,
  networkAuthority: Keypair,
  gatekeeperAuthority: Keypair,
  program: anchor.Program<SolanaAnchorGateway>,
  programProvider: anchor.AnchorProvider
) => {
  const adminService = await AdminService.buildFromAnchor(
    program,
    networkAuthority.publicKey,
    {
      clusterType: 'localnet',
      wallet: new anchor.Wallet(adminAuthority),
    },
    programProvider
  );

  const [gatekeeperPDA] = await NetworkService.createGatekeeperAddress(
    gatekeeperAuthority.publicKey,
    networkAuthority.publicKey
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

  const [stakingPDA] = await NetworkService.createStakingAddress(
    gatekeeperAuthority.publicKey
  );

  networkService = await NetworkService.buildFromAnchor(
    program,
    gatekeeperAuthority.publicKey,
    gatekeeperPDA,
    {
      clusterType: 'localnet',
      wallet: new anchor.Wallet(gatekeeperAuthority),
    },
    programProvider
  );
};
