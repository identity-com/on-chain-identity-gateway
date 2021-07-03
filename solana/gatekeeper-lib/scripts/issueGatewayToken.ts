import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "../src/util/constants";
import { GatekeeperNetworkService } from "../src/service/GatekeeperNetworkService";
import { GatekeeperService } from "../src/service/GatekeeperService";
import { homedir } from "os";
import * as path from "path";
import { argv } from "yargs";
import { decode } from "bs58";

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

// const gatekeeperNetwork = myKeypair;
// const gatekeeperNetworkService = new GatekeeperNetworkService(
//   connection,
//   payer,
//   gatekeeperNetwork
// );

const payer = myKeypair;

(async function () {
  const gatekeeperAuthority = Keypair.fromSecretKey(
    decode(
      "1XV16t4fRWypt8avQRa3kwxXFaijuU3XkMSDezdy7r9L3cX8Dom5DKL3sj59bh4k8jAdFNQnpTdqsFYYXz2XKp"
    )
  );
  
  console.log("gatekeeper " + gatekeeperAuthority.publicKey.toBase58());
  // const gatekeeperAuthority = Keypair.generate();
  // const gatekeeperAccount = await gatekeeperNetworkService.addGatekeeper(
  //   gatekeeperAuthority.publicKey
  // );

  const gatekeeperNetworkKey = new PublicKey(
    "5ToosRGYyxoJgk3DopmrY93Bvx1DRKU5nrtQbUZrMR3e"
  );

  // console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
  const gatekeeperService = new GatekeeperService(
    connection,
    payer,
    gatekeeperNetworkKey,
    gatekeeperAuthority
  );
  const owner = argv.owner
    ? new PublicKey(argv.owner as string)
    : Keypair.generate().publicKey;

  console.log("owner", owner.toBase58());
  const issuedToken = await gatekeeperService.issue(owner);
  console.log("issuedToken", issuedToken);
})().catch((error) => console.error(error));
