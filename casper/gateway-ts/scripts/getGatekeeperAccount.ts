import { Connection, PublicKey } from "@solana/web3.js";
import { gatekeeperExists } from "../src";

// default to the civic cluster
const endpoint =
  process.env.CLUSTER_ENDPOINT ||
  "http://ec2-34-238-243-215.compute-1.amazonaws.com:8899";

const connection = new Connection(endpoint, "processed");

const gatekeeperKey = new PublicKey(
  "G1y4BUXnbSMsdcXbCTMEdRWW9Th9tU9WfAmgbPDX7rRG"
);

const networkKey = new PublicKey(process.argv[2]);

(async function () {
  const gatekeeperAccount = await gatekeeperExists(
    connection,
    gatekeeperKey,
    networkKey
  );
  if (!gatekeeperAccount) throw new Error("No account found");
  console.log("account exists");
})().catch((error) => console.error(error));
