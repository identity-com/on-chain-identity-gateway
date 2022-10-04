import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { AdminService } from '../../src/AdminService';
import { GatewayV2 } from '../../target/types/gateway_v2';
import * as anchor from '@project-serum/anchor';
import { airdrop } from '../../src/lib/utils';
import { expect, use } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import { NetworkAccount } from '../../src/lib/types';
import { NetworkKeyFlags } from '../../src/lib/constants';
import { Wallet } from '@project-serum/anchor/dist/cjs/provider';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let service: AdminService;
  let dataAccount: PublicKey;
  let authority: Wallet;
  const extraAuthKey = Keypair.generate();
  const feeKeypair = Keypair.generate();

  before(async () => {
    authority = programProvider.wallet;

    [dataAccount] = await AdminService.createNetworkAddress(
      authority.publicKey,
      0
    );

    service = await AdminService.buildFromAnchor(
      program,
      dataAccount,
      'localnet',
      programProvider
    );

    // service = await AdminService.build(dataAccount, authority, "localnet")

    await service
      .createNetwork({
        authThreshold: 1,
        passExpireTime: 400,
        fees: [
          {
            token: programProvider.wallet.publicKey,
            issue: 0.0001,
            refresh: 0.0001,
            expire: 0.0001,
            verify: 0.0001,
          },
          {
            token: feeKeypair.publicKey,
            issue: 100,
            refresh: 100,
            expire: 100,
            verify: 100,
          },
        ],
        authKeys: [
          {
            flags: NetworkKeyFlags.AUTH | NetworkKeyFlags.SET_EXPIRE_TIME,
            key: programProvider.wallet.publicKey,
          },
          {
            flags: NetworkKeyFlags.AUTH | NetworkKeyFlags.SET_EXPIRE_TIME,
            key: extraAuthKey.publicKey,
          },
        ],
        networkIndex: 0,
        gatekeepers: [],
        supportedTokens: [],
      })
      .rpc();
  });

  describe('Update Network', () => {
    it('Should update passExpireTime', async function () {
      // retrieves the network account
      let networkAccount = await service.getNetworkAccount();
      // updates the network with a new pass expire time
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 600,
          fees: {
            add: [
              {
                token: Keypair.generate().publicKey,
                issue: 0.0001,
                refresh: 0.0001,
                expire: 0.0001,
                verify: 0.0001,
              },
            ],
            remove: [],
          },
          authKeys: {
            add: [],
            remove: [],
          },
          networkFeatures: 1,
          supportedTokens: {
            add: [],
            remove: [],
          },
          gatekeepers: {
            add: [],
            remove: [],
          },
        })
        .rpc();
      // retrieves the network again
      networkAccount = await service.getNetworkAccount();
      // expects the pass expire time on the network to now equal 600
      expect(networkAccount?.passExpireTime).to.equal(600);
    }).timeout(10000);
    it('Should add an authKey', async function () {
      // generates a new auth keypair
      let authKeypair = Keypair.generate();
      // retrieves network account
      let networkAccount = await service.getNetworkAccount();
      // updates network with an additional fee and an additional auth key
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: {
            add: [
              {
                token: Keypair.generate().publicKey,
                issue: 0.0001,
                refresh: 0.0001,
                expire: 0.0001,
                verify: 0.0001,
              },
            ],
            remove: [],
          },
          authKeys: {
            add: [
              {
                flags: NetworkKeyFlags.AUTH | NetworkKeyFlags.SET_EXPIRE_TIME,
                key: authKeypair.publicKey,
              },
            ],
            remove: [],
          },
          networkFeatures: 1,
          supportedTokens: {
            add: [],
            remove: [],
          },
          gatekeepers: {
            add: [],
            remove: [],
          },
        })
        .rpc();
      // retrieves network account
      networkAccount = await service.getNetworkAccount();
      // expects the added auth key to exist in the updated network account
      expect(
        networkAccount?.authKeys.filter(
          (authKey) =>
            authKey.key.toBase58() === authKeypair.publicKey.toBase58()
        )
      ).to.have.lengthOf(1);
    }).timeout(10000);
    it('Should remove an authKey', async function () {
      // updates network with the removal of an auth key, and addition of a fee
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: {
            add: [
              {
                token: Keypair.generate().publicKey,
                issue: 0.0001,
                refresh: 0.0001,
                expire: 0.0001,
                verify: 0.0001,
              },
            ],
            remove: [],
          },
          authKeys: {
            add: [],
            remove: [extraAuthKey.publicKey],
          },
          networkFeatures: 1,
          supportedTokens: {
            add: [],
            remove: [],
          },
          gatekeepers: {
            add: [],
            remove: [],
          },
        })
        .rpc();
      // retrieves network account
      const networkAccount = await service.getNetworkAccount();
      // expect that one of the original auth keys for the network has now been removed
      expect(
        networkAccount?.authKeys.filter(
          (authKey) =>
            authKey.key.toBase58() === extraAuthKey.publicKey.toBase58()
        )
      ).to.have.lengthOf(0);
    }).timeout(10000);
    it('Should not be able to remove own account from authKeys', async function () {
      // expects an update to the network in which the network's own account is removed from its auth keys to fail
      return expect(
        service
          .updateNetwork({
            authThreshold: 1,
            passExpireTime: 400,
            fees: {
              add: [
                {
                  token: Keypair.generate().publicKey,
                  issue: 0.0001,
                  refresh: 0.0001,
                  expire: 0.0001,
                  verify: 0.0001,
                },
              ],
              remove: [],
            },
            authKeys: {
              add: [],
              remove: [programProvider.wallet.publicKey],
            },
            networkFeatures: 1,
            supportedTokens: {
              add: [],
              remove: [],
            },
            gatekeepers: {
              add: [],
              remove: [],
            },
          })
          .rpc()
      ).to.eventually.be.rejected;
    }).timeout(10000);
    it("Updates an existing authKey's flags", async function () {
      // retrieves the network account
      let networkAccount = await service.getNetworkAccount();
      // retrieves the original auth key before update
      const originalKeyBeforeUpdate = networkAccount?.authKeys.filter(
        (authKey) =>
          authKey.key.toBase58() === programProvider.wallet.publicKey.toBase58()
      )[0];
      // updates the network by modifying an existing auth key's flags
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: {
            add: [
              {
                token: Keypair.generate().publicKey,
                issue: 0.0001,
                refresh: 0.0001,
                expire: 0.0001,
                verify: 0.0001,
              },
            ],
            remove: [],
          },
          authKeys: {
            add: [
              {
                flags:
                  NetworkKeyFlags.AUTH |
                  NetworkKeyFlags.SET_EXPIRE_TIME |
                  NetworkKeyFlags.ADD_FEES,
                key: programProvider.wallet.publicKey,
              },
            ],
            remove: [],
          },
          networkFeatures: 1,
          supportedTokens: {
            add: [],
            remove: [],
          },
          gatekeepers: {
            add: [],
            remove: [],
          },
        })
        .rpc();
      // retrieves the network account again
      networkAccount = await service.getNetworkAccount();
      // assigns the updated key to a const
      const originalKeyAfterUpdate = networkAccount?.authKeys.filter(
        (authKey) =>
          authKey.key.toBase58() === programProvider.wallet.publicKey.toBase58()
      )[0];
      // expect that the key's flags before update and the key's flags after update will not match
      expect(originalKeyBeforeUpdate?.flags).to.not.equal(
        originalKeyAfterUpdate?.flags
      );
    }).timeout(10000);
    it('Can add fees correctly', async function () {
      // retrieves the network account
      let networkAccount = await service.getNetworkAccount();
      // generates a new fee token
      let additionalFeeToken = Keypair.generate();
      // updates the network with a new fee addition
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: {
            add: [
              {
                token: additionalFeeToken.publicKey,
                issue: 100,
                refresh: 100,
                expire: 100,
                verify: 100,
              },
            ],
            remove: [],
          },
          authKeys: {
            add: [],
            remove: [],
          },
          networkFeatures: 1,
          supportedTokens: {
            add: [],
            remove: [],
          },
          gatekeepers: {
            add: [],
            remove: [],
          },
        })
        .rpc();
      // retrieves the network account again
      networkAccount = await service.getNetworkAccount();
      // expects the new fees to contain a fee with a token matching the public key from the keypair generated above
      expect(
        networkAccount?.fees.filter(
          (fee) =>
            fee.token.toBase58() === additionalFeeToken.publicKey.toBase58()
        ).length
      ).to.equal(1);
    }).timeout(10000);
    it('Can remove fees correctly', async function () {
      // retrieves the network account
      let networkAccount = await service.getNetworkAccount();
      // updates the network with the removal of a fee
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: {
            add: [],
            remove: [feeKeypair.publicKey],
          },
          authKeys: {
            add: [],
            remove: [],
          },
          networkFeatures: 1,
          supportedTokens: {
            add: [],
            remove: [],
          },
          gatekeepers: {
            add: [],
            remove: [],
          },
        })
        .rpc();
      // retrieves the network account again
      networkAccount = await service.getNetworkAccount();
      // expects the previously existing fee to no longer exist
      expect(
        networkAccount?.fees.filter(
          (fee) => fee.token.toBase58() === feeKeypair.publicKey.toBase58()
        ).length
      ).to.equal(0);
    }).timeout(10000);
    // TODO: Add test covering the removal of an auth key combined with addition of flags... expect to fail
  });
});
