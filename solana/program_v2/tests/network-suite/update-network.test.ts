import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { GatewayService } from "../../src/GatewayService";
import { GatewayV2 } from "../../target/types/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { airdrop } from "../../src/lib/utils";
import { expect } from "chai";
import { describe } from "mocha";
import { NetworkAccount } from "../../src/lib/types";

describe("Gateway v2 Client", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let service: GatewayService;
  let dataAccount: PublicKey;
  let authorityKeypair: Keypair;

  let authority;

  before(async () => {
    authorityKeypair = Keypair.generate();
    authority = new anchor.Wallet(authorityKeypair);
    // authority = programProvider.wallet;
    await airdrop(
      programProvider.connection,
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    [dataAccount] = await GatewayService.createNetworkAddress(
      authority.publicKey
    );

    service = await GatewayService.buildFromAnchor(
      program,
      dataAccount,
      "localnet",
      programProvider,
      authority
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
            flags: 1,
            key: programProvider.wallet.publicKey,
          },
        ],
      })
      .rpc();
  });

  describe("Update Network", () => {
    it.only("Should Update Network Properly", async function () {
      let networkAccount =
        (await service.getNetworkAccount()) as NetworkAccount;
      console.log(networkAccount);
      await service
        .updateNetwork(
          // TODO: I think the error here is something to do with passing in the right authority
          {
            authThreshold: 1,
            passExpireTime: 500,
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
              add: [{ flags: 1, key: Keypair.generate().publicKey }],
              remove: [],
            },
          },
          dataAccount,
          authorityKeypair
        )
        .rpc();
      expect(networkAccount?.passExpireTime).to.equal(500);
    }).timeout(10000);
  });
});
