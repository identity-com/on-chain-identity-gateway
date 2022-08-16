import {
  Keypair,
  Connection,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  getNetworkAccount,
  NetworkKeyFlagsValues,
  NetworkData,
} from "../../src/state";
import assert from "assert";
import mocha from "mocha";
import { Program } from "@project-serum/anchor";
import { GatewayService } from "../../src/GatewayService";
import { GatewayV2, IDL } from "../../src/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { before } from "mocha";
import chai from "chai";
import { expect } from "chai";

// describe("sol-did controller operations", () => {
// Configure the client to use the local cluster.
// anchor.setProvider(anchor.AnchorProvider.env());
// const program = anchor.workspace.gateway_v2;
// const programID = program.getID();
// const programProvider = program.provider as anchor.AnchorProvider;
// const authority = programProvider.connection;
// const solKey = anchor.web3.Keypair.generate();
// });

describe("Gateway v2 Client", () => {
  describe("Create Network", () => {
    it.only("should be equivalent", async function () {
      let connection = new Connection("http://localhost:8899", "confirmed");
      console.log("connection confirmed");
      const programId = new PublicKey(
        "FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe"
      );

      const program = anchor.workspace.gateway_v2 as Program<GatewayV2>;
      const programProvider = program.provider as anchor.AnchorProvider;
      const authority = programProvider.wallet;
      let service: GatewayService;
      const nonAuthoritySigner = anchor.web3.Keypair.generate();
      const nonAuthorityWallet = new anchor.Wallet(nonAuthoritySigner);

      service = await GatewayService.buildFromAnchor(
        program,
        "localnet",
        programProvider,
        authority
      );

      let createdNetwork = service.createNetwork(
        authority.publicKey
      ).instruction;
      console.log("created network");
      // expect(createdNetwork.).to.not.be.null;
    });
  });
});

// const network = Keypair.generate();
// const funder = Keypair.generate();
// const networkData = new NetworkData(
//   new u8(1),
//   new i64(BigInt(60) * BigInt(60)),
//   new u16(0),
//   new u8(0),
//   [],
//   [
//     new NetworkAuthKey(
//       NetworkKeyFlags.fromFlagsArray([NetworkKeyFlagsValues.AUTH]),
//       wallet
//     ),
//   ]
// );
// const transactionInstructions = createNetwork(
//   programId,
//   network,
//   funder,
//   networkData
// );
// console.log(`${network.publicKey} ${funder.publicKey}`);

// await connection
//   .requestAirdrop(funder.publicKey, LAMPORTS_PER_SOL * 10)
//   .then((res) => {
//     return connection.confirmTransaction(res, "confirmed");
//   });
// const transaction = new Transaction();
// transaction.feePayer = funder.publicKey;
// transaction.recentBlockhash = (
//   await connection.getLatestBlockhash()
// ).blockhash;
// const transactionSignature = await connection.sendTransaction(
//   transaction,
//   [funder],
//   { skipPreflight: true }
// );
// const confirmation = await connection.confirmTransaction(
//   transactionSignature
// );
// if (confirmation.value.err) {
//   console.error(
//     await connection
//       .getTransaction(transactionSignature)
//       .then((res) => res?.meta?.logMessages)
//   );
//   throw confirmation.value.err;
// }
// const networkAccount = await getNetworkAccount(
//   new Connection("http://127.0.0.1:8899"),
//   network.publicKey
// );
