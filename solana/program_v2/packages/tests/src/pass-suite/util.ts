import * as anchor from '@project-serum/anchor';
import { GatekeeperService } from '@identity.com/gateway_v2-client/src/GatekeeperService';
import { airdrop } from '@identity.com/gateway_v2-client/src/lib/utils';
import {
  TEST_GATEKEEPER,
  TEST_GATEKEEPER_AUTHORITY,
  TEST_NETWORK,
} from '../util/constants';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { GatewayV2 } from '@identity.com/gateway_v2-idl/src/gateway_v2';
import { NetworkService } from '@identity.com/gateway_v2-client/src/NetworkService';
import { Wallet } from '@project-serum/anchor';
import { loadPrivateKey } from '../util/lib';
import { before } from 'mocha';

anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
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
    authority.publicKey,
    dataAccount,
    'localnet',
    programProvider,
    new Wallet(authority)
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
    LAMPORTS_PER_SOL * 2
  );

  const service = await GatekeeperService.buildFromAnchor(
    program,
    network,
    TEST_GATEKEEPER,
    'localnet',
    programProvider,
    authority
  );

  return service;
};
