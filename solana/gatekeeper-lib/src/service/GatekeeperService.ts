import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { issueVanilla } from "../util/solana/instruction";
import {
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  getGatewayTokenKeyForOwner,
  send,
} from "../util/solana/util";
import { PII, Recorder, RecorderFS } from "../util/record";
import { ipLookup, validIp } from "../util/ipCheck";

export class GatekeeperService {
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAuthority: Keypair,
    private recorder: Recorder = new RecorderFS()
  ) {}

  async issueVanilla(owner: PublicKey, seed: Uint8Array = Buffer.from([0])) {
    const gatewayTokenKey = await getGatewayTokenKeyForOwner(owner);
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    const transaction = new Transaction().add(
      issueVanilla(
        seed,
        gatewayTokenKey,
        this.payer.publicKey,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork
      )
    );

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return gatewayTokenKey;
  }

  async issue(recipient: PublicKey, pii: PII, checkIp = false) {
    // TODO move the IP details check to the API
    const ipDetails = pii.ipAddress ? ipLookup(pii.ipAddress) : null;
    const approved =
      (pii.ipAddress && (!checkIp || validIp(pii.ipAddress))) || false;

    const recipientTokenAccount = await this.issueVanilla(recipient);
    const record = {
      timestamp: new Date().toISOString(),
      token: recipientTokenAccount.toBase58(),
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

    await storeRecordPromise;

    return record;
  }
}
