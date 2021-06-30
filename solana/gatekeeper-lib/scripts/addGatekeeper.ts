import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { GatekeeperNetworkService } from "../src/service/GatekeeperNetworkService";
import { homedir } from "os";
import * as path from "path";

const mySecretKey = require(path.join(
  homedir(),
  ".config",
  "solana",
  // gatekeeper network key
  "gatsGgZznicBQq9ybbygjizWvq5i3pTzrjTE6Cafz36.json" //"id.json"
));
const myKeypair = Keypair.fromSecretKey(Buffer.from(mySecretKey));

const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  SOLANA_COMMITMENT
);

const service = new GatekeeperNetworkService(connection, myKeypair, myKeypair);

const gatekeeperAuthority = new PublicKey(
  "civQnFJNKpRpyvUejct4mfExBi7ZzRXu6U3hXWMxASn"
); //Keypair.generate().publicKey;

(async function () {
  const gatekeeperAccount = await service.addGatekeeper(gatekeeperAuthority);

  console.log(gatekeeperAccount.toBase58());
})().catch((error) => console.error(error));
