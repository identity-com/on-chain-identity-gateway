import { AnchorProvider, Program } from "@project-serum/anchor";
import { GatewayService } from "../../src/GatewayService";
import { GatewayV2, IDL } from "../../src/gateway_v2";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { airdrop } from "../../src/lib/utils";

describe("Gateway v2 Client", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  let service: GatewayService;

  const program = anchor.workspace.GatewayV2 as Program<GatewayV2>;
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
    it.only("should be equivalent", async function () {
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

      let createdNetwork = service.createNetwork(authority.publicKey).rpc();

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
