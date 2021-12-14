import {Provider, Wallet} from "@project-serum/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { clusterApiUrl } from "@solana/web3.js";
import { draw } from "../src";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const getProvider = async (keypair: Keypair): Promise<Provider> => {
  const wallet = new Wallet(keypair);
  return new Provider(connection, wallet, {});
};

(async () => {
  const provider = await getProvider(Keypair.generate());
  const res = await draw({
    dapp: Keypair.generate().publicKey,
    epoch: 0,
    gatekeeperProvider: provider,
    oracle: Keypair.generate().publicKey,
    token: Keypair.generate().publicKey,
  });

  console.log(res);
})().catch(console.error);
