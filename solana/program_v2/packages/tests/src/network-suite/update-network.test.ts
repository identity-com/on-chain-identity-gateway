import { Keypair } from '@solana/web3.js';
import {
  AdminService,
  airdrop,
  NetworkKeyFlags,
} from '@identity.com/gateway-solana-client';
import { SolanaAnchorGateway } from '@identity.com/gateway-solana-idl';
import * as anchor from '@project-serum/anchor';
import { expect } from 'chai';
import * as chai from 'chai';
import { describe } from 'mocha';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Gateway v2 Client', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .SolanaAnchorGateway as anchor.Program<SolanaAnchorGateway>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let serviceAsGuardian: AdminService;
  let serviceAsNetwork: AdminService;
  let guardianAuthority: Keypair;
  let networkAuthority: Keypair;
  const extraAuthKey = Keypair.generate();
  const feeKeypair = Keypair.generate();

  before(async () => {
    networkAuthority = Keypair.generate();
    guardianAuthority = Keypair.generate();

    await airdrop(programProvider.connection, networkAuthority.publicKey);
    await airdrop(programProvider.connection, guardianAuthority.publicKey);

    serviceAsGuardian = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(guardianAuthority),
      },
      programProvider
    );

    serviceAsNetwork = await AdminService.buildFromAnchor(
      program,
      networkAuthority.publicKey,
      {
        clusterType: 'localnet',
        wallet: new anchor.Wallet(networkAuthority),
      },
      programProvider
    );

    await serviceAsGuardian
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
        supportedTokens: [],
      })
      .withPartialSigners(networkAuthority)
      .rpc();
  });

  describe('Update Network', () => {
    it('Should update passExpireTime', async () => {
      // Act
      await serviceAsGuardian
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
        })
        .rpc();

      const networkAccount = await serviceAsGuardian.getNetworkAccount();

      // Assert
      expect(networkAccount?.passExpireTime).to.equal(600);
    }).timeout(10000);

    it('Should add an authKey', async () => {
      const authKeypair = Keypair.generate();

      await serviceAsGuardian
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
        })
        .rpc();

      const networkAccount = await serviceAsGuardian.getNetworkAccount();

      expect(
        networkAccount?.authKeys.filter(
          (authKey) =>
            authKey.key.toBase58() === authKeypair.publicKey.toBase58()
        )
      ).to.have.lengthOf(1);
    }).timeout(10000);

    it('Should remove an authKey', async () => {
      await serviceAsGuardian
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
        })
        .rpc();

      const networkAccount = await serviceAsGuardian.getNetworkAccount();
      expect(
        networkAccount?.authKeys.filter(
          (authKey) =>
            authKey.key.toBase58() === extraAuthKey.publicKey.toBase58()
        )
      ).to.have.lengthOf(0);
    }).timeout(10000);

    it('Should not be able to remove own account from authKeys', async () => {
      return expect(
        serviceAsNetwork
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
          })
          .rpc()
      ).to.eventually.be.rejected;
    }).timeout(10000);

    it("Updates an existing authKey's flags", async () => {
      let networkAccount = await serviceAsGuardian.getNetworkAccount();
      const originalKeyBeforeUpdate = networkAccount?.authKeys.filter(
        (authKey) =>
          authKey.key.toBase58() === programProvider.wallet.publicKey.toBase58()
      )[0];
      await serviceAsGuardian
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
        })
        .rpc();
      networkAccount = await serviceAsGuardian.getNetworkAccount();
      const originalKeyAfterUpdate = networkAccount?.authKeys.filter(
        (authKey) =>
          authKey.key.toBase58() === programProvider.wallet.publicKey.toBase58()
      )[0];
      expect(originalKeyBeforeUpdate?.flags).to.not.equal(
        originalKeyAfterUpdate?.flags
      );
    }).timeout(10000);

    it('Can add fees correctly', async () => {
      let networkAccount = await serviceAsGuardian.getNetworkAccount();
      const additionalFeeToken = Keypair.generate();
      await serviceAsGuardian
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
        })
        .rpc();
      networkAccount = await serviceAsGuardian.getNetworkAccount();
      expect(
        networkAccount?.fees.filter(
          (fee) =>
            fee.token.toBase58() === additionalFeeToken.publicKey.toBase58()
        ).length
      ).to.equal(1);
    }).timeout(10000);

    it('Can remove fees correctly', async () => {
      let networkAccount = await serviceAsGuardian.getNetworkAccount();
      await serviceAsGuardian
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
        })
        .rpc();
      networkAccount = await serviceAsGuardian.getNetworkAccount();
      expect(
        networkAccount?.fees.filter(
          (fee) => fee.token.toBase58() === feeKeypair.publicKey.toBase58()
        ).length
      ).to.equal(0);
    }).timeout(10000);
  });
});
