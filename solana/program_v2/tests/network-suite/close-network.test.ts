import { PublicKey } from "@solana/web3.js";
import assert from "assert";
import mocha from "mocha";

import { GatewayService } from "../../src/GatewayService";
import { GatewayV2 } from "../../src/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { airdrop } from "../../src/lib/utils";
import { expect } from "chai";

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
    await airdrop(programProvider.connection, nonAuthoritySigner.publicKey);

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

    service.createNetwork(authority.publicKey).rpc();
  });

  // Fund nonAuthoritySigner
  describe("Close Network", () => {
    it.only("Should Close Network Properly", async function () {
      const closedNetwork = service.closeNetwork(
        authority.publicKey
      ).instruction;
      console.log(`${closedNetwork.authority}`);
      expect(closedNetwork.authority).to.not.be.null;
    }).timeout(10000);
  });
});
