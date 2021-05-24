import { Connection, PublicKey } from "@solana/web3.js";
import { getGatekeeperAccount } from "../src";
import { GatekeeperData } from "../dist/lib/GatekeeperData";

// default to the civic cluster
const endpoint =
  process.env.CLUSTER_ENDPOINT ||
  "http://ec2-3-238-152-85.compute-1.amazonaws.com:8899";

const connection = new Connection(endpoint, "processed");

const gatekeeperKey = new PublicKey(
  "G1y4BUXnbSMsdcXbCTMEdRWW9Th9tU9WfAmgbPDX7rRG"
);

const prettyPrint = (gatekeeperAccount: GatekeeperData) => ({
  authority: gatekeeperAccount.authority.toPublicKey().toBase58(),
  network: gatekeeperAccount.network.toPublicKey().toBase58(),
});

(async function () {
  const gatekeeperAccount = await getGatekeeperAccount(
    connection,
    gatekeeperKey
  );
  if (!gatekeeperAccount) throw new Error("No account found");
  console.log(prettyPrint(gatekeeperAccount));
})().catch((error) => console.error(error));
