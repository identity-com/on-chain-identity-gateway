import {
  Keypair,
  Connection,
  Transaction,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { getNetworkAccount, NetworkKeyFlagsValues } from "../src/state";
import assert from "assert";
import mocha from "mocha";

import { NetworkData, createNetwork } from "../src/create-network";
import { u8, u16, i64, NetworkAuthKey, NetworkKeyFlags } from "../src/state";

describe("Gateway v2 Client", () => {
  describe("Create Network", () => {
    it("should be equivalent", async function () {
      this.timeout(30_000);
      let connection = new Connection("http://localhost:8899", "confirmed");
      const programId = new PublicKey(
        "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
      );
      const network = Keypair.generate();
      const funder = Keypair.generate();
      const randomKey = Keypair.generate().publicKey;
      const networkData = new NetworkData(
        new u8(1),
        new i64(BigInt(60) * BigInt(60)),
        new u16(0),
        new u8(0),
        [],
        [
          new NetworkAuthKey(
            NetworkKeyFlags.fromFlagsArray([NetworkKeyFlagsValues.AUTH]),
            randomKey
          ),
        ]
      );
      console.log("network auth key");
      const transactionInstructions = await createNetwork(
        programId,
        network,
        funder,
        networkData
      );
      const latestBlockHash = await connection.getLatestBlockhash();

      await connection
        .requestAirdrop(funder.publicKey, LAMPORTS_PER_SOL * 10)
        .then((res) => {
          return connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: res,
          });
        });

      console.log("airdropped");
      const transaction = new Transaction();
      transaction.add(transactionInstructions[0]);
      transaction.add(transactionInstructions[1]);
      transaction.feePayer = funder.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      const transactionSignature = await connection.sendTransaction(
        transaction,
        [network, funder],
        { skipPreflight: true }
      );
      const latestBlockHash2 = await connection.getLatestBlockhash();

      const confirmation = await connection.confirmTransaction({
        blockhash: latestBlockHash2.blockhash,
        lastValidBlockHeight: latestBlockHash2.lastValidBlockHeight,
        signature: transactionSignature,
      });
      console.log("confirmation: ", confirmation);
      if (confirmation.value.err) {
        console.error(
          await connection.getTransaction(transactionSignature).then((res) => {
            return res?.meta?.logMessages;
          })
        );
        throw confirmation.value.err;
      }
      const networkAccount = await getNetworkAccount(
        new Connection("http://127.0.0.1:8899"),
        network.publicKey
      );
    });
  });
});
