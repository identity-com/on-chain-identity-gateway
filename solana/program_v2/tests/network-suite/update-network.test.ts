import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { GatewayService } from "../../src/GatewayService";
import { GatewayV2 } from "../../src/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { airdrop } from "../../src/lib/utils";
import { expect } from "chai";

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

    await service.createNetwork().rpc();
  });

  describe("Update Network", () => {
    it.only("Should Update Network Properly", async function () {
      let networkAccount = await service.getNetworkAccount();

      await service
        .updateNetwork({
          authThreshold: 1,
          passExpireTime: 500,
          networkDataLen: 0,
          fees: { add: [], remove: [] },
          authKeys: [{ flags: 1, key: programProvider.wallet.publicKey }],
        })
        .rpc();

      networkAccount = await service.getNetworkAccount();
      expect(networkAccount?.passExpireTime).to.equal(500);
    }).timeout(10000);
  });
});
