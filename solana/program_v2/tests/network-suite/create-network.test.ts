import { GatewayService } from "../../src/GatewayService";
import { GatewayV2, IDL } from "../../src/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { airdrop } from "../../src/lib/utils";
import { expect } from "chai";
import { describe } from "mocha";

describe("Gateway v2 Client", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let service: GatewayService;

  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  let dataAccount: PublicKey;

  before(async () => {
    const authority = new anchor.Wallet(Keypair.generate());
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
  });

  describe("Create Network", () => {
    it("Creates a Network w/ Default Values", async function () {
      await service.createNetwork().rpc();

      const createdNetwork = await service.getNetworkAccount();

      // console.log(createdNetwork);
      expect(createdNetwork).to.not.be.null;
    });
    it("Creates a Network w/ Non-Default Values", async function () {
      await service
        .createNetwork({
          authThreshold: 1,
          passExpireTime: 400,
          networkDataLen: 0,
          signerBump: 0,
          fees: [
            {
              token: programProvider.wallet.publicKey,
              issue: 100,
              refresh: 100,
              expire: 100,
              verify: 100,
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

      const createdNetwork = await service.getNetworkAccount();

      expect(createdNetwork?.passExpireTime).to.equal(400);
    });
  });
});
