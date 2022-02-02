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
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
    gatekeeperAuthority,
    gatekeeperNetworkKey,
    gatekeeperAuthority
  );
  const useWallet = Keypair.generate();

  // issue a token with 1 second expiry
  const builtIssueTransaction: BuildGatewayTokenTransactionResult =
    await gatekeeperService.buildIssueTransaction(useWallet.publicKey);
  console.log("builtTransaction", builtIssueTransaction);
  const issueResult = await gatekeeperService.sendSerializedTransaction(
    builtIssueTransaction.serializedTx,
    builtIssueTransaction.gatewayTokenAddress
  );
  console.log("issue result signature", issueResult.signature);

  console.log("waiting 2 seconds for token to be created on-chain...");
  await sleep(5000);

  let gatewayToken = await gatekeeperService.findGatewayTokenForOwner(
    useWallet.publicKey
  );
  if (!gatewayToken?.expiryTime)
    throw new Error("No GatewayToken found on-chain");

  console.log("issues gatewayToken expiry", gatewayToken?.expiryTime);
  // build a refresh transaction
  const builtRefreshTransaction: BuildGatewayTokenTransactionResult =
    await gatekeeperService.buildUpdateExpiryTransaction(
      gatewayToken.publicKey,
      gatewayToken?.expiryTime + 1000 * 60
    );

  const refreshResult = await gatekeeperService.sendSerializedTransaction(
    builtRefreshTransaction.serializedTx,
    builtRefreshTransaction.gatewayTokenAddress
  );

  const refreshResult2 = await gatekeeperService.sendSerializedTransaction(
    builtRefreshTransaction.serializedTx,
    builtRefreshTransaction.gatewayTokenAddress
  );
  console.log("refresh result signature", { refreshResult, refreshResult2 });

  gatewayToken = await gatekeeperService.findGatewayTokenForOwner(
    useWallet.publicKey
  );
  if (!gatewayToken?.expiryTime)
    throw new Error("No GatewayToken found on-chain");
  console.log("after refresh gatewayToken expiry", gatewayToken?.expiryTime);
})().catch((error) => console.error(error));
