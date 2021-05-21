import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { GatewayTokenStatus, Recorder, RecorderFS } from "../util/record";

export type PII = {
  name?: string;
  ipAddress?: string;
  selfDeclarationTextAgreedTo?: string;
} & Record<string, any>;

// TODO remove deprecated service
export class IssueService {
  constructor(
    private connection: Connection,
    private gatekeeper: Keypair,
    private mintAccountPublicKey: PublicKey,
    private recorder: Recorder = new RecorderFS()
  ) {}

  async issue(recipient: PublicKey, pii: PII, checkIp = false) {
    console.log("Getting min balance for new account");
    const accountBalanceNeeded = await Token.getMinBalanceRentForExemptAccount(
      this.connection
    );

    console.log("this.mintAccountPublicKey", this.mintAccountPublicKey);
    const recipientTokenAccount = Keypair.generate();

    const record = {
      timestamp: new Date().toISOString(),
      token: recipientTokenAccount.publicKey.toBase58(),
      ...pii,
      name: pii.name || "-",
      ipAddress: pii.ipDetails?.ipAddress || "-",
      country: pii.ipDetails?.country || "-",
      selfDeclarationTextAgreedTo: pii.selfDeclarationTextAgreedTo || "-",
      status: GatewayTokenStatus.ACTIVE,
    };

    const storeRecordPromise = this.recorder.store(record);

    const createTokenAccount = SystemProgram.createAccount({
      fromPubkey: this.gatekeeper.publicKey,
      newAccountPubkey: recipientTokenAccount.publicKey,
      lamports: accountBalanceNeeded,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    const initAccount = Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      this.mintAccountPublicKey,
      recipientTokenAccount.publicKey,
      recipient
    );
    const mintTo = Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      this.mintAccountPublicKey,
      recipientTokenAccount.publicKey,
      this.gatekeeper.publicKey,
      [],
      1
    );
    const transaction = new Transaction().add(
      createTokenAccount,
      initAccount,
      mintTo
    );

    console.log("Sending tx");
    const txSignature = await this.connection.sendTransaction(transaction, [
      this.gatekeeper,
      recipientTokenAccount,
    ]);
    console.log("Waiting for tx to confirm");
    await this.connection.confirmTransaction(txSignature);
    console.log("TX confirmed");

    await storeRecordPromise;

    return record;
  }
}
