import {
  AdminService,
  GatekeeperKeyFlags,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import { describe } from 'mocha';
import { generateFundedKey } from '../util/lib';

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let adminService: AdminService;
  let networkService: NetworkService;
  let gatekeeperDataAccount: PublicKey;
  let stakingDataAccount: PublicKey;

  let adminAuthority: Keypair;
  let networkAuthority: Keypair;
  let gatekeeperAuthority: Keypair;

  beforeEach(async () => {
    adminAuthority = await generateFundedKey();
    networkAuthority = await generateFundedKey();
    gatekeeperAuthority = await generateFundedKey();

    [gatekeeperDataAccount] = await NetworkService.createGatekeeperAddress(
      gatekeeperAuthority.publicKey,
      networkAuthority.publicKey
    );
    [stakingDataAccount] = await NetworkService.createStakingAddress(
      networkAuthority.publicKey
    );

    adminService = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(adminAuthority),
      },
      programProvider
    );

    networkService = await NetworkService.buildFromAnchor(
      program,
      gatekeeperAuthority.publicKey,
      gatekeeperDataAccount,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(gatekeeperAuthority),
      },
      programProvider
    );

    await adminService
      .createNetwork()
      .withPartialSigners(networkAuthority)
      .rpc();
  });

  describe('Create Gatekeeper', () => {
    it('Creates a gatekeeper w/ default data on an established network', async function () {
      // creates a gatekeeper with the admin's authority
      await networkService
        .createGatekeeper(
          networkAuthority.publicKey,
          stakingDataAccount,
          adminAuthority.publicKey
        )
        .withPartialSigners(adminAuthority)
        .rpc();

      // retrieves the gatekeeper
      const gatekeeperAccount = await networkService.getGatekeeperAccount();
      // tests to see if the requested gatekeeper's associated network equals the adminAuthority (or network) public key
      expect(gatekeeperAccount?.gatekeeperNetwork.toBase58()).to.equal(
        networkAuthority.publicKey.toBase58()
      );

      const network = await adminService.getNetworkAccount();
      expect(network?.gatekeepers.length).to.equal(1);
    }).timeout(10000);

    it('Cannot create a gatekeeper with no auth keys', async function () {
      return expect(
        networkService
          .createGatekeeper(
            networkAuthority.publicKey,
            stakingDataAccount,
            adminAuthority.publicKey,
            {
              tokenFees: [],
              authThreshold: 1,
              authKeys: [],
              supportedTokens: [],
            }
          )
          .withPartialSigners(adminAuthority)
          .rpc()
      ).to.eventually.be.rejectedWith(/InsufficientAuthKeys/);
    }).timeout(10000);
  });

  it('Cannot create a gatekeeper with insufficient auth keys', async function () {
    return expect(
      networkService
        .createGatekeeper(
          networkAuthority.publicKey,
          stakingDataAccount,
          adminAuthority.publicKey,
          {
            tokenFees: [],
            authThreshold: 2,
            authKeys: [
              {
                flags: GatekeeperKeyFlags.AUTH,
                key: gatekeeperAuthority.publicKey,
              },
            ],
            supportedTokens: [],
          }
        )
        .withPartialSigners(adminAuthority)
        .rpc()
    ).to.eventually.be.rejectedWith(/InsufficientAuthKeys/);
  }).timeout(10000);
});
