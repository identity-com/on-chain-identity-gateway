import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token'
import {Account, Connection, PublicKey} from '@solana/web3.js'
import * as fs from 'fs'

const GATEKEEPER_CONFIG_PATH = process.env.GATEKEEPER_KEY || './gatekeeper.json'
export const MIN_AIRDROP_BALANCE = 100000000

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const airdropTo = async (connection: Connection, account: { publicKey: PublicKey}, lamports = MIN_AIRDROP_BALANCE) => {
  console.log(`Airdropping to ${account.publicKey.toBase58()}...`)
  let retries = 30
  await connection.requestAirdrop(account.publicKey, lamports)
  for (;;) {
    await sleep(500)
    const balance = await connection.getBalance(account.publicKey)
    if (balance >= lamports) {
      console.log('Airdrop done')
      return account
    }
    if (--retries <= 0) {
      break
    }
  }
  throw new Error(`Airdrop of ${lamports} failed`)
}

export const newAccount = async (
  connection: Connection,
  lamports?: number,
): Promise<Account> => {
  const account = new Account()

  await airdropTo(connection, account, lamports)
  return account
}
export const getNewMintAccount = (connection: Connection, gatekeeper: Account) => Token.createMint(connection, gatekeeper, gatekeeper.publicKey, gatekeeper.publicKey, 0, TOKEN_PROGRAM_ID)

const newGatekeeper = async (connection: Connection): Promise<{ gatekeeper: Account; mintAccountPublicKey: PublicKey }> => {
  const gatekeeper: Account = await newAccount(connection)
  const mintAccount: Token = await getNewMintAccount(connection, gatekeeper)
  fs.writeFileSync(GATEKEEPER_CONFIG_PATH, JSON.stringify({secretKey: gatekeeper.secretKey, mintAccountPublicKey: mintAccount.publicKey.toBase58()}))
  return {gatekeeper, mintAccountPublicKey: mintAccount.publicKey}
}

export const getGatekeeper = async (connection: Connection): Promise<{ gatekeeper: Account; mintAccountPublicKey: PublicKey }> => {
  if (fs.existsSync(GATEKEEPER_CONFIG_PATH)) {
    const parsedGatekeeperConfig = JSON.parse(fs.readFileSync(GATEKEEPER_CONFIG_PATH, 'utf8'))
    const {secretKey}  = parsedGatekeeperConfig
    const gatekeeper = new Account(secretKey)

    const balance = await connection.getBalance(gatekeeper.publicKey)

    if (balance < MIN_AIRDROP_BALANCE) {
      await airdropTo(connection, gatekeeper)
    }

    let {mintAccountPublicKey} = parsedGatekeeperConfig
    if (!mintAccountPublicKey) {
      const mintAccount: Token = await getNewMintAccount(connection, gatekeeper)
      mintAccountPublicKey =  mintAccount.publicKey
      fs.writeFileSync(GATEKEEPER_CONFIG_PATH, JSON.stringify({secretKey: gatekeeper.secretKey, mintAccountPublicKey: mintAccountPublicKey.toBase58()}))
    }

    return {gatekeeper, mintAccountPublicKey: new PublicKey(mintAccountPublicKey)}
  }

  return newGatekeeper(connection)
}
