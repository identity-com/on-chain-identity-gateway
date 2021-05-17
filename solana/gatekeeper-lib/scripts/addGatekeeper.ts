import { Connection, Keypair } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { GatekeeperNetworkService } from "../src/service/GatekeeperNetworkService";
import { homedir } from "os";
import * as path from "path";

const mySecretKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  "id.json"
));
const myKeypair = Keypair.fromSecretKey(Buffer.from(mySecretKey));

const connection = new Connection("http://localhost:8899", SOLANA_COMMITMENT);

const service = new GatekeeperNetworkService(connection, myKeypair, myKeypair);

const gatekeeperAuthority = Keypair.generate().publicKey;

(async function () {
  const gatekeeperAccount = await service.addGatekeeper(gatekeeperAuthority);

  console.log(gatekeeperAccount.toBase58());
})().catch((error) => console.error(error));
