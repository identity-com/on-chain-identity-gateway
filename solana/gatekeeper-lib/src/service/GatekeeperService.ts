import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  getGatewayTokenKeyForOwner,
  send,
  issueVanilla,
} from "@identity.com/solana-gateway-ts";
import { PII, Recorder, RecorderFS } from "../util/record";

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
    const recipientTokenAccount = await this.issueVanilla(recipient);
    const record = {
      timestamp: new Date().toISOString(),
      token: recipientTokenAccount.toBase58(),
      ...pii,
      name: pii.name || "-",
      ipAddress: pii.ipDetails?.ipAddress || "-",
      country: pii.ipDetails?.country || "-",
      selfDeclarationTextAgreedTo: pii.selfDeclarationTextAgreedTo || "-",
    };

    const storeRecordPromise = this.recorder.store(record);

    await storeRecordPromise;

    return record;
  }
}
