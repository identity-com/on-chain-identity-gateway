import {Connection, PublicKey, Account} from '@solana/web3.js'
import {Token, TOKEN_PROGRAM_ID, AccountInfo} from '@solana/spl-token'
import {airdropTo, MIN_AIRDROP_BALANCE} from '../util/account'

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
)

async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey> {
  return (await PublicKey.findProgramAddress(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  ))[0]
}

const mintAccounts = [
  {
    alias: 'SRM',
    mintAccount: new PublicKey('8YMiwqX9LEW5uibGnW3RPWAsG9CWhYTLKtxaa7TBByr3'),
    amount: 10000000,
  },
  {
    alias: 'USDC',
    mintAccount: new PublicKey('BsufJnDzG1yVshES744dHwF4u1ZrXq51V6ZuuUo16J9i'),
    amount: 10000000,
  },
]
const airdropSolIfReqiured = async (connection: Connection, userPublicKey: PublicKey): Promise<void> => {
  const balance = await connection.getBalance(userPublicKey)
  console.log('balance', {userPublicKey: userPublicKey.toBase58(), balance, MIN_AIRDROP_BALANCE})
  if (balance < MIN_AIRDROP_BALANCE) {
    await airdropTo(connection, {publicKey: userPublicKey})
  }
}
export class AirdropService {
  constructor(private connection: Connection, private gatekeeper: Account, private mintAuthorityAccount: Account)  {}

  async createAndFundTokenAccounts(userPublicKey: PublicKey): Promise<AccountInfo[]> {
    await airdropSolIfReqiured(this.connection, userPublicKey)

    const mintTokenForUserAccount = async ({alias, mintAccount, amount}: { alias: string; mintAccount: PublicKey; amount: number }): Promise<AccountInfo> => {
      console.log('mintTokenForUserAccount', {alias, mintAccount, userPublicKey: userPublicKey.toBase58()})
      const tokenAddress = await findAssociatedTokenAddress(userPublicKey, mintAccount)
      console.log('tokenAddress', tokenAddress)

      const mint = new Token(this.connection, mintAccount, TOKEN_PROGRAM_ID, this.gatekeeper)
      console.log('mint', mint)
      // check token address exists
      const userTokenAccountInfo = await this.connection.getAccountInfo(tokenAddress)
      console.log('existing userTokenAccountInfo', userTokenAccountInfo)
      let associatedTokenAccount = tokenAddress
      if (!userTokenAccountInfo) {
        console.log('No token exists, calling mint.createAssociatedTokenAccount', {alias})
        associatedTokenAccount = await mint.createAssociatedTokenAccount(userPublicKey)
        console.log('associatedTokenAccount', associatedTokenAccount)
        // mint.createAccount(tokenAddress)
      }

      // const tokenAccount = await mint.createAccount(myAccount.publicKey)
      console.log('attempting to mint to token account', {amount, associatedTokenAccount: associatedTokenAccount.toBase58()})
      await mint.mintTo(associatedTokenAccount, this.mintAuthorityAccount, [], amount)
      console.log('minted successfully...')
      const tokenAccountInfo = await mint.getAccountInfo(associatedTokenAccount)
      console.log('tokenAccountInfo', tokenAccountInfo)
      return tokenAccountInfo
    }
    const mintPromises = mintAccounts.map(mintTokenForUserAccount)
    const tokenAccountInfos = await Promise.all(mintPromises)

    return tokenAccountInfos
  }
}
