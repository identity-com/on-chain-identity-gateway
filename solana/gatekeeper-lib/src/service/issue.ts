import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { PII, Recorder, RecorderFS } from "../util/record";
import { ipLookup, validIp } from "../util/ipCheck";

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

    const ipDetails = pii.ipAddress ? ipLookup(pii.ipAddress) : null;
    const approved =
      (pii.ipAddress && (!checkIp || validIp(pii.ipAddress))) || false;

    const record = {
      timestamp: new Date().toISOString(),
      token: recipientTokenAccount.publicKey.toBase58(),
      ...pii,
      name: pii.name || "-",
      ipAddress: pii.ipAddress || "-",
      country: ipDetails?.country || "-",
      approved,
      selfDeclarationTextAgreedTo: pii.selfDeclarationTextAgreedTo || "-",
    };

    if (!record.approved) {
      console.log(record);
      throw new Error("Blocked IP " + pii.ipAddress);
    }

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
