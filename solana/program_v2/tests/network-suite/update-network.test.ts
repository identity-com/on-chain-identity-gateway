import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { GatewayService } from "../../src/GatewayService";
import { GatewayV2 } from "../../target/types/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { airdrop } from "../../src/lib/utils";
import { expect } from "chai";
import { describe } from "mocha";
import { NetworkAccount } from "../../src/lib/types";
import { NetworkKeyFlags } from "../../src/lib/constants";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";

describe("Gateway v2 Client", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let service: GatewayService;
  let dataAccount: PublicKey;
  let authority: Wallet;

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
        ],
      })
      .rpc();
  });

  describe("Update Network", () => {
    it("Should Update Network Properly", async function () {
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
  });
});
