import { GatewayService } from "../../src/GatewayService";
import { GatewayV2, IDL } from "../../src/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { airdrop } from "../../src/lib/utils";
import { expect } from "chai";
import { describe } from "mocha";

describe("Gateway v2 Client", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let service: GatewayService;

  const program = anchor.workspace.GatewayV2 as anchor.Program<GatewayV2>;
  const programProvider = program.provider as anchor.AnchorProvider;

  const authority = programProvider.wallet;

  const nonAuthoritySigner = anchor.web3.Keypair.generate();

  before(async () => {
    service = await GatewayService.buildFromAnchor(
      program,
      authority.publicKey,
      "localnet",
      programProvider
    );

    // Fund nonAuthoritySigner
    await airdrop(programProvider.connection, nonAuthoritySigner.publicKey);
  });
  describe("Create Network", () => {
    it.only("Creates a Network", async function () {
      // (see sol-did didDataAccount)
      const [network, bump] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("gk-network"),
          authority.publicKey.toBuffer(),
        ],
        program.programId
      );

      service = await GatewayService.buildFromAnchor(
        program,
        network,
        "localnet",
        programProvider,
        authority
      );

      let createdNetwork = await service
        .createNetwork(authority.publicKey)
        .rpc();
      console.log(createdNetwork);
      expect(createdNetwork).to.not.be.null;
    });
  });
});