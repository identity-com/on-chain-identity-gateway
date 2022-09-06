import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { GatewayService } from "../../src/GatewayService";
import { GatewayV2 } from "../../target/types/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { airdrop } from "../../src/lib/utils";
import { expect, use } from "chai";
import * as chai from "chai";
import { describe } from "mocha";
import { NetworkAccount } from "../../src/lib/types";
import { NetworkKeyFlags } from "../../src/lib/constants";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

describe("Gateway v2 Client", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let service: GatewayService;
  let dataAccount: PublicKey;
  let authority: Wallet;
  const extraAuthKey = Keypair.generate();

  before(async () => {
    authority = programProvider.wallet;

    [dataAccount] = await GatewayService.createNetworkAddress(
      authority.publicKey
    );

    service = await GatewayService.buildFromAnchor(
      program,
      dataAccount,
      "localnet",
      programProvider
    );

    // service = await GatewayService.build(dataAccount, authority, "localnet")

    await service
      .createNetwork({
        authThreshold: 1,
        passExpireTime: 400,
        signerBump: 0,
        fees: [
          {
            token: programProvider.wallet.publicKey,
            issue: 0.0001,
            refresh: 0.0001,
            expire: 0.0001,
            verify: 0.0001,
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
      })
      .rpc();
  });

  describe("Update Network", () => {
    it("Should update passExpireTime", async function () {
      let networkAccount = await service.getNetworkAccount();
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
        })
        .rpc();
      networkAccount = await service.getNetworkAccount();
      expect(networkAccount?.passExpireTime).to.equal(600);
    }).timeout(10000);
    it("Should add an authKey", async function () {
      let authKeypair = Keypair.generate();
      let networkAccount = await service.getNetworkAccount();
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
        })
        .rpc();
      networkAccount = await service.getNetworkAccount();
      expect(
        networkAccount?.authKeys.filter(
          (authKey) =>
            authKey.key.toBase58() === authKeypair.publicKey.toBase58()
        )
      ).to.have.lengthOf(1);
    }).timeout(10000);
    it("Should remove an authKey", async function () {
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
        })
        .rpc();

      const networkAccount = await service.getNetworkAccount();
      expect(
        networkAccount?.authKeys.filter(
          (authKey) =>
            authKey.key.toBase58() === extraAuthKey.publicKey.toBase58()
        )
      ).to.have.lengthOf(0);
    }).timeout(10000);
    it("Should not be able to remove own account from authKeys", async function () {
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
          })
          .rpc()
      ).to.eventually.be.rejected;
    }).timeout(10000);
    it("Updates an existing authKey's flags", async function () {
      let networkAccount = await service.getNetworkAccount();
      const originalKeyBeforeUpdate = networkAccount?.authKeys.filter(
        (authKey) =>
          authKey.key.toBase58() === programProvider.wallet.publicKey.toBase58()
      )[0];
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
        })
        .rpc();
      networkAccount = await service.getNetworkAccount();
      const originalKeyAfterUpdate = networkAccount?.authKeys.filter(
        (authKey) =>
          authKey.key.toBase58() === programProvider.wallet.publicKey.toBase58()
      )[0];
      expect(originalKeyBeforeUpdate?.flags).to.not.equal(
        originalKeyAfterUpdate?.flags
      );
    }).timeout(10000);
    it.only("Should update fees correctly", async function () {
      let authKeypair = Keypair.generate();
      let networkAccount = await service.getNetworkAccount();
      console.log(networkAccount?.fees);
      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          fees: {
            add: [
              {
                token: Keypair.generate().publicKey,
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
        })
        .rpc();
      networkAccount = await service.getNetworkAccount();
      console.log(networkAccount?.fees);
    }).timeout(10000);
  });
});
