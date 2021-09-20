import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { airdropTo } from "../src/util";
import { GatekeeperNetworkService } from "../src/service/GatekeeperNetworkService";
import { GatekeeperService } from "../src/service/GatekeeperService";
import { homedir } from "os";
import * as path from "path";
import { argv } from "yargs";
/**
 * Usage: ts-node ./scripts/testGatewayTokenStates.ts
 */
const mySecretKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  "id.json"
));
const myKeypair = Keypair.fromSecretKey(Buffer.from(mySecretKey));

const clusterUrl = "http://localhost:8899";
const connection = new Connection(clusterUrl, SOLANA_COMMITMENT);

const gatekeeperNetwork = myKeypair;
const payer = myKeypair;
const gatekeeperNetworkService = new GatekeeperNetworkService(
  connection,
  payer,
  gatekeeperNetwork
);

(async function () {
  const gatekeeperAuthority = Keypair.generate();
  await airdropTo(connection, gatekeeperAuthority.publicKey, clusterUrl);
  const gatekeeperAccount = await gatekeeperNetworkService.addGatekeeper(
    gatekeeperAuthority.publicKey
  );

  console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
  const gatekeeperService = new GatekeeperService(
    connection,
    payer,
    gatekeeperNetwork.publicKey,
    gatekeeperAuthority
  );
  const owner = argv.owner
    ? new PublicKey(argv.owner as string)
    : Keypair.generate().publicKey;

  console.log("owner", owner.toBase58());
  let gatewayToken = await gatekeeperService.issue(owner);
  console.log("issued token", gatewayToken);

  console.log(`freezing ${gatewayToken.publicKey}...`);
  gatewayToken = await gatekeeperService.freeze(gatewayToken.publicKey);
  console.log("frozen token", gatewayToken);

  console.log(`unfreezing ${gatewayToken.publicKey.toBase58()}...`);
  gatewayToken = await gatekeeperService.unfreeze(
    new PublicKey(gatewayToken.publicKey.toBase58())
  );
  console.log("unfrozen token", gatewayToken);

  console.log(`revoking ${gatewayToken.publicKey.toBase58()}...`);
  gatewayToken = await gatekeeperService.revoke(
    new PublicKey(gatewayToken.publicKey.toBase58())
  );
  console.log("revoked token", gatewayToken);
})().catch((error) => console.error(error));
