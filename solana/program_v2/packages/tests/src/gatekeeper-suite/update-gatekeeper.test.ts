import {
  NetworkService,
  GatekeeperKeyFlags,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { expect } from 'chai';
import { describe } from 'mocha';
import { setUpAdminNetworkGatekeeper } from '../test-set-up';
import { setGatekeeperFlagsAndFees } from '../util/lib';

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let networkService: NetworkService;
  let stakingPDA: PublicKey;

  before(async () => {
    ({ networkService, stakingPDA } = await setUpAdminNetworkGatekeeper(
      program,
      programProvider
    ));
  });

  describe('Update Gatekeeper', () => {
    it('Updates a gatekeeper on an established network', async function () {
      // updates gatekeeper with new data
      await setGatekeeperFlagsAndFees(
        stakingPDA,
        networkService,
        GatekeeperKeyFlags.AUTH | GatekeeperKeyFlags.WITHDRAW
      );

      // retrieves the gatekeeper account
      const gatekeeperAccount = await networkService.getGatekeeperAccount();
      // expects there to be an additional auth key matching the additionalKey defined above
      expect(
        gatekeeperAccount?.authKeys.filter(
          (auth) =>
            auth.key.toBase58() ===
            networkService.getWallet().publicKey.toBase58()
        ).length
      ).to.equal(1);
    }).timeout(10000);
  });
});
