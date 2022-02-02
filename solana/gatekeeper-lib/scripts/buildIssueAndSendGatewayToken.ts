import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { GatekeeperNetworkService } from "../src/service/GatekeeperNetworkService";
import { GatekeeperService } from "../src/service/GatekeeperService";
import { homedir } from "os";
import * as path from "path";
import { argv } from "yargs";
import { decode } from "bs58";
import { BuildGatewayTokenTransactionResult } from "../src/util/connection";

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
  const owner = argv.owner ? new PublicKey(argv.owner as string) : wallet;

  console.log("owner", owner.toBase58());
  const builtTransaction: BuildGatewayTokenTransactionResult =
    await gatekeeperService.buildIssueTransaction(owner);

  console.log("builtTransaction", builtTransaction);
  const result = await gatekeeperService.sendSerializedTransaction(
    builtTransaction.serializedTx,
    builtTransaction.gatewayTokenAddress
  );

  console.log("result", result);
})().catch((error) => console.error(error));
