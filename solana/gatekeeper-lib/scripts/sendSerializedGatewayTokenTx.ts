import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { GatekeeperService } from "../src/service/GatekeeperService";
import { homedir } from "os";
import * as path from "path";
import { argv } from "yargs";
import { decode } from "bs58";

/**
 * Usage: 
    npx ts-node scripts/sendSerializedGatewayTokenTx.ts \
    --gatewayTokenAddress=Ha8zGJVUo56VnVp6AEShYNiJmGkY5Yf8m7EBLVTWNYw6  \
    --unsignedSerializedTx=AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIE3x6vb/z2zcTeEk10jh6M7hHEbyFdAL0K+nj4wTg3YzP2ODBVFE7OPp+89wiJ1zMMFAOVJrCJKdRZJjkXFi0wdcXig3r7vZEjGriLtwKPe8gKVUMBWom8r59jwkyIGA6uCiP4wZwKTf/19S8mrshUOmIqDMXGHlEZPp1JE9zEq16ThKvipVUHKjnhiV43RSjkb/3b+lL0d46YFPFAgC+m0gEDAwEAAgkDmAzpYQAAAAA=
 */
const mySecretKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  "id.json"
));
const myKeypair = Keypair.fromSecretKey(Buffer.from(mySecretKey));

const endpoint =
  process.env.CLUSTER_ENDPOINT ||
  "http://ec2-34-238-243-215.compute-1.amazonaws.com:8899";
// "http://localhost:8899";
const connection = new Connection(endpoint, SOLANA_COMMITMENT);

const payer = myKeypair;

(async function () {
  const gatekeeperAuthority = Keypair.fromSecretKey(
    decode(
      "1XV16t4fRWypt8avQRa3kwxXFaijuU3XkMSDezdy7r9L3cX8Dom5DKL3sj59bh4k8jAdFNQnpTdqsFYYXz2XKp"
    )
  );

  console.log("gatekeeper " + gatekeeperAuthority.publicKey.toBase58());
  const gatekeeperNetworkKey = new PublicKey(
    "tigoYhp9SpCDoCQmXGj2im5xa3mnjR1zuXrpCJ5ZRmi"
  );

  const gatekeeperService = new GatekeeperService(
    connection,
    payer,
    gatekeeperNetworkKey,
    gatekeeperAuthority
  );
  const wallet = Keypair.generate().publicKey;

  console.log("unsignedSerializedTx", argv.unsignedSerializedTx);
  console.log("gatewayTokenAddress", argv.gatewayTokenAddress);
  const result = await gatekeeperService.signAndSendTransaction(
    argv.unsignedSerializedTx as string,
    new PublicKey(argv.gatewayTokenAddress as string)
  );

  console.log("result", result);
})().catch((error) => console.error(error));
