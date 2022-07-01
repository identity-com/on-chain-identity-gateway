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
} from "../src/state";
import assert from "assert";
import mocha from "mocha";

import { closeNetwork } from "../src/close-network";
import { createNetwork } from "../src/create-network";
import { u8, u16, i64, NetworkAuthKey, NetworkKeyFlags } from "../src/state";

describe("Gateway v2 Client", () => {
  describe("Close Network", () => {
    it("should first create the network", async function () {
      this.timeout(120_000);
      let connection = new Connection("http://localhost:8899", "confirmed");
      console.log("connection confirmed");
      const programId = new PublicKey(
        "FtVtKsibAR1QGdc389JbgcomKLq34U9tY8HyWPWoYQY6"
      );
      const network = Keypair.generate();
      const funder = Keypair.generate();
      const receiver = Keypair.generate();
      const signer = Keypair.generate();
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
      const createNetworkTransactionInstructions = await createNetwork(
        programId,
        network,
        funder,
        networkData
      );

      await connection
        .requestAirdrop(funder.publicKey, LAMPORTS_PER_SOL * 10)
        .then((res) => {
          return connection.confirmTransaction(res, "confirmed");
        });
      await connection
        .requestAirdrop(receiver.publicKey, LAMPORTS_PER_SOL * 10)
        .then((res) => {
          return connection.confirmTransaction(res, "confirmed");
        });
      console.log("airdropped");
      const transaction = new Transaction();
      transaction.add(createNetworkTransactionInstructions[0]);
      transaction.add(createNetworkTransactionInstructions[1]);
      transaction.feePayer = funder.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      const createNetworkTransactionSignature =
        await connection.sendTransaction(transaction, [network, funder], {
          skipPreflight: true,
        });
      console.log(createNetworkTransactionSignature);
      const confirmation = await connection.confirmTransaction(
        createNetworkTransactionSignature,
        "confirmed"
      );
      if (confirmation.value.err) {
        console.log(
          await connection
            .getTransaction(createNetworkTransactionSignature)
            .then((res) => res?.meta?.logMessages)
        );
        throw confirmation.value.err;
      }
      const networkAccount = await getNetworkAccount(
        new Connection("http://127.0.0.1:8899"),
        network.publicKey
      );

      const closeNetworkTransactionInstructions = await closeNetwork(
        programId,
        network,
        receiver,
        signer
      );

      const transaction2 = new Transaction();
      transaction2.add(closeNetworkTransactionInstructions);
      transaction2.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const closeNetworkTransactionSignature = await connection.sendTransaction(
        transaction2,
        [receiver, signer]
      );
      console.log(closeNetworkTransactionSignature);

      await getNetworkAccount(
        new Connection("http://127.0.0.1:8899"),
        network.publicKey
      ).then((res) => console.log(res));
    });
  });
});
