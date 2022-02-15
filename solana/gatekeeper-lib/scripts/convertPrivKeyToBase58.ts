// Convert Keypair to Byte58
// Run via:
// $ ./node_modules/.bin/ts-node scripts/convertPrivKeyToBase58.ts ~/solana/key.json
// Reverse via
// $ echo <SECRET-BASE58> | base58 --decode | od -t u1 -An | tr -d \\n | awk '{$1=$1};1' | sed -E "s/[[:space:]]+/,/g" | awk '{print "["$1"]"}' > ~/solana/key.json
import { readKey } from "../src/util/account";
import * as bs58 from "bs58";

const filePath = process.argv.pop();
console.log(`Converting Key at: ${filePath}`);

if (filePath) {
  const key = readKey(filePath);
  console.log(bs58.encode(key.secretKey));
} else {
  console.error("No filepath given");
}
