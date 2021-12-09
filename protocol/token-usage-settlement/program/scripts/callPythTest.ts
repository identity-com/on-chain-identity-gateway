import {
  Program,
  Provider,
  setProvider,
  workspace,
} from "@project-serum/anchor";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import { PythTest } from "../target/types/pyth_test";
import * as process from "process";
import * as path from "path";
import * as os from "os";

process.env.ANCHOR_WALLET =
  process.env.USAGE_WALLET ||
  path.join(os.homedir(), ".config", "solana", "id.json");

const provider = Provider.local(clusterApiUrl("devnet"));
setProvider(provider);

const program = workspace.PythTest as Program<PythTest>;

(async () => {
  const result = await program.rpc.run({
    accounts: {
      // SOL/USD devnet
      product: new PublicKey("3Mnn2fX6rQyUsyELYms1sBJyChWofzSNRoqYzvgMVz5E"),
      price: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
    },
  });
  console.log(result);
})().catch(console.error);
