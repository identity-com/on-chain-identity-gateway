import * as anchor from '@coral-xyz/anchor';
import { Wallet } from '@coral-xyz/anchor';
import {
  airdrop,
  GatekeeperService,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import {
  TEST_GATEKEEPER,
  TEST_GATEKEEPER_AUTHORITY,
  TEST_NETWORK,
} from '../util/constants';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import { loadPrivateKey } from '../util/lib';
import { before } from 'mocha';

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace
  .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
const programProvider = program.provider as anchor.AnchorProvider;

before(() => {
  if (process.env.SOLANA_LOGS) {
    programProvider.connection.onLogs('all', (logs) => {
      console.log(logs);
    });
  }
});

export const createNetworkService = async (
  authority: Keypair = Keypair.generate(),
  network: PublicKey = TEST_NETWORK
): Promise<NetworkService> => {
  await airdrop(
    programProvider.connection,
    authority.publicKey,
    LAMPORTS_PER_SOL
  );

  const [dataAccount] = await NetworkService.createGatekeeperAddress(
    authority.publicKey,
    network
  );

  return NetworkService.buildFromAnchor(
    program,
    authority.publicKey, // TODO: Replace with network authority
    authority.publicKey,
    dataAccount,
    {
      clusterType: 'localnet',
      wallet: new Wallet(authority),
    },
    programProvider
  );
};

export const createGatekeeperService = async (
  gatekeeper: PublicKey = TEST_GATEKEEPER_AUTHORITY,
  network: PublicKey = TEST_NETWORK
): Promise<GatekeeperService> => {
  const authorityKeypair = await loadPrivateKey(gatekeeper.toBase58());
  const authority = new anchor.Wallet(authorityKeypair);

  await airdrop(
    programProvider.connection,
    authority.publicKey,
    LAMPORTS_PER_SOL
  );

  const service = await GatekeeperService.buildFromAnchor(
    program,
    network,
    TEST_GATEKEEPER,
    {
      clusterType: 'localnet',
      wallet: authority,
    },
    programProvider
  );
  return service;
};
