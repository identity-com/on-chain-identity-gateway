import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, Connection, PublicKey, Account } from "@solana/web3.js";
import * as fs from "fs";

const GATEKEEPER_CONFIG_PATH =
  process.env.GATEKEEPER_KEY || "./gatekeeper.json";
export const MIN_AIRDROP_BALANCE = 100000000;

// Needed because spl-token still uses web3 Account
export const keypairToAccount = (keypair: Keypair) =>
  new Account(keypair.secretKey);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const airdropTo = async (
  connection: Connection,
  account: { publicKey: PublicKey },
  lamports = MIN_AIRDROP_BALANCE
) => {
  // eslint-disable-next-line no-console
  console.log(`Airdropping to ${account.publicKey.toBase58()}...`);
  let retries = 30;
  await connection.requestAirdrop(account.publicKey, lamports);
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(500);
    // eslint-disable-next-line no-await-in-loop
    const balance = await connection.getBalance(account.publicKey);
    if (balance >= lamports) {
      // eslint-disable-next-line no-console
      console.log("Airdrop done");
      return account;
    }
    if (--retries <= 0) {
      break;
    }
  }
  throw new Error(`Airdrop of ${lamports} failed`);
};

export const newAccount = async (
  connection: Connection,
  lamports?: number
): Promise<Keypair> => {
  const account = Keypair.generate();

  await airdropTo(connection, account, lamports);
  return account;
};
export const getNewMintAccount = (
  connection: Connection,
  gatekeeper: Keypair
) => {
  const gatekeeperAccount = keypairToAccount(gatekeeper);
  return Token.createMint(
    connection,
    gatekeeperAccount,
    gatekeeper.publicKey,
    gatekeeper.publicKey,
    0,
    TOKEN_PROGRAM_ID
  );
};

const newGatekeeper = async (
  connection: Connection
): Promise<{ gatekeeper: Keypair; mintAccountPublicKey: PublicKey }> => {
  const gatekeeper: Keypair = await newAccount(connection);
  const mintAccount: Token = await getNewMintAccount(connection, gatekeeper);
  fs.writeFileSync(
    GATEKEEPER_CONFIG_PATH,
    JSON.stringify({
      secretKey: gatekeeper.secretKey,
      mintAccountPublicKey: mintAccount.publicKey.toBase58(),
    })
  );
  return { gatekeeper, mintAccountPublicKey: mintAccount.publicKey };
};

export const getGatekeeper = async (
  connection: Connection
): Promise<{ gatekeeper: Keypair; mintAccountPublicKey: PublicKey }> => {
  if (fs.existsSync(GATEKEEPER_CONFIG_PATH)) {
    const parsedGatekeeperConfig = JSON.parse(
      fs.readFileSync(GATEKEEPER_CONFIG_PATH, "utf8")
    );
    const { secretKey } = parsedGatekeeperConfig;
    const gatekeeper = Keypair.fromSecretKey(secretKey);

    const balance = await connection.getBalance(gatekeeper.publicKey);

    if (balance < MIN_AIRDROP_BALANCE) {
      await airdropTo(connection, gatekeeper);
    }

    let { mintAccountPublicKey } = parsedGatekeeperConfig;
    if (!mintAccountPublicKey) {
      const mintAccount: Token = await getNewMintAccount(
        connection,
        gatekeeper
      );
      mintAccountPublicKey = mintAccount.publicKey;
      fs.writeFileSync(
        GATEKEEPER_CONFIG_PATH,
        JSON.stringify({
          secretKey: gatekeeper.secretKey,
          mintAccountPublicKey: mintAccountPublicKey.toBase58(),
        })
      );
    }

    return {
      gatekeeper,
      mintAccountPublicKey: new PublicKey(mintAccountPublicKey),
    };
  }

  return newGatekeeper(connection);
};
