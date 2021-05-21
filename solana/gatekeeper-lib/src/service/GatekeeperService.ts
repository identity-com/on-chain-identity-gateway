import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  freeze,
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  getGatewayTokenKeyForOwner,
  issueVanilla,
  revoke,
  unfreeze,
  updateExpiry,
} from "@identity.com/solana-gateway-ts";
import {
  AuditRecord,
  GatewayTokenStatus,
  PII,
  Recorder,
  RecorderFS,
} from "../util/record";
import { send } from "../util/connection";

const updateRecordStatus = async (
  recorder: Recorder,
  gatewayTokenKey: PublicKey,
  status: GatewayTokenStatus
): Promise<AuditRecord> => {
  const record = await recorder.lookup(gatewayTokenKey);
  console.log("existing record", record);
  if (!record)
    throw new Error(`No Audit record found for token ${gatewayTokenKey}`);

  const updatedRecord = {
    timestamp: new Date().toISOString(),
    token: record.token,
    name: record.name,
    ipAddress: record.ipAddress,
    country: record.country,
    selfDeclarationTextAgreedTo: record.selfDeclarationTextAgreedTo,
    status,
  };
  await recorder.store(updatedRecord);
  return updatedRecord;
};

type GatekeeperConfig = {
  defaultExpirySeconds?: number;
};

export class GatekeeperService {
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAuthority: Keypair,
    private recorder: Recorder = new RecorderFS(),
    private config: GatekeeperConfig = {}
  ) {}

  private getDefaultExpireTime(): number | undefined {
    if (!this.config.defaultExpirySeconds) return undefined;
    const now = Math.floor(Date.now() / 1000);
    return now + this.config.defaultExpirySeconds;
  }

  private async issueVanilla(owner: PublicKey, seed?: Uint8Array) {
    const gatewayTokenKey = await getGatewayTokenKeyForOwner(owner);
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );

    const expireTime = this.getDefaultExpireTime();

    const transaction = new Transaction().add(
      issueVanilla(
        gatewayTokenKey,
        this.payer.publicKey,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork,
        seed,
        expireTime
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

  async issue(recipient: PublicKey, pii: PII): Promise<AuditRecord> {
    const recipientTokenAccount = await this.issueVanilla(recipient);
    const record = {
      timestamp: new Date().toISOString(),
      token: recipientTokenAccount.toBase58(),
      ...pii,
      name: pii.name || "-",
      ipAddress: pii.ipDetails?.ipAddress || "-",
      country: pii.ipDetails?.country || "-",
      selfDeclarationTextAgreedTo: pii.selfDeclarationTextAgreedTo || "-",
      status: GatewayTokenStatus.ACTIVE,
    };

    const storeRecordPromise = this.recorder.store(record);

    await storeRecordPromise;

    return record;
  }

  async revoke(gatewayTokenKey: PublicKey): Promise<AuditRecord> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      revoke(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    const updatedRecord = await updateRecordStatus(
      this.recorder,
      gatewayTokenKey,
      GatewayTokenStatus.REVOKED
    );

    return updatedRecord;
  }

  async freeze(gatewayTokenKey: PublicKey): Promise<AuditRecord> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      freeze(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    const updatedRecord = await updateRecordStatus(
      this.recorder,
      gatewayTokenKey,
      GatewayTokenStatus.FROZEN
    );

    return updatedRecord;
  }

  async unfreeze(gatewayTokenKey: PublicKey): Promise<AuditRecord> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      unfreeze(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    const updatedRecord = await updateRecordStatus(
      this.recorder,
      gatewayTokenKey,
      GatewayTokenStatus.ACTIVE
    );

    return updatedRecord;
  }

  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number
  ): Promise<AuditRecord> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(
        this.gatekeeperAuthority.publicKey
      );
    const transaction = new Transaction().add(
      updateExpiry(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount,
        expireTime
      )
    );

    await send(this.connection, transaction, this.gatekeeperAuthority);

    return updateRecordStatus(
      this.recorder,
      gatewayTokenKey,
      GatewayTokenStatus.ACTIVE
    );
  }
}
