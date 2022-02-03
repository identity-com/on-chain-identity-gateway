import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

(async () => {
  // Replace this
  const networkKeypair = Keypair.generate();
  // Replace this
  const funder = Keypair.generate();
  // Replace this
  const cluster: Cluster = "devnet";

  const gatewayProgram = new PublicKey(
    "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
  );
  const expireAddress = await PublicKey.findProgramAddress(
    [networkKeypair.publicKey.toBuffer(), Buffer.from("expire")],
    gatewayProgram
  );
  console.log(
    `expire address: (${expireAddress[0].toBase58()}, ${expireAddress[1]})`
  );
  const data = Buffer.from([5, 0]);
  const connection = new Connection(clusterApiUrl(cluster));
  if (cluster == "devnet") {
    await connection.requestAirdrop(funder.publicKey, 900880);
  }
  const transaction = new Transaction();
  transaction.add(
    new TransactionInstruction({
      data,
      keys: [
        { pubkey: funder.publicKey, isSigner: true, isWritable: true },
        { pubkey: networkKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: expireAddress[0], isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: gatewayProgram,
    })
  );
  transaction.feePayer = funder.publicKey;
  const signature = await connection.sendTransaction(
    transaction,
    [networkKeypair, funder],
    { skipPreflight: true }
  );
  console.log(`Transaction Signature: ${signature}`);
  const response = await connection.confirmTransaction(signature);
  if (response.value.err) {
    console.log(`Transaction Failed: ${response.value.err}`);
  } else {
    console.log("Transaction Successful");
  }
})().catch((e) => console.error(e));
