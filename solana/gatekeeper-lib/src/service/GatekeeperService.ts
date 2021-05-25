import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  freeze,
  GatewayToken,
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  getGatewayToken,
  getGatewayTokenKeyForOwner,
  issueVanilla,
  revoke,
  State,
  unfreeze,
  updateExpiry,
} from "@identity.com/solana-gateway-ts";
import { AuditRecord, PII, Recorder, RecorderFS } from "../util/record";
import { send } from "../util/connection";

const updateRecordWithToken = async (
  recorder: Recorder,
  gatewayToken: GatewayToken,
  additionalAuditInformation: Partial<AuditRecord> = {}
): Promise<AuditRecord> => {
  const record = await recorder.lookup(gatewayToken.publicKey);
  console.log("existing record", record);
  if (!record)
    throw new Error(
      `No Audit record found for token ${gatewayToken.publicKey}`
    );

  const updatedRecord = {
    timestamp: new Date().toISOString(),
    token: record.token,
    name: record.name,
    ipAddress: record.ipAddress,
    country: record.country,
    selfDeclarationTextAgreedTo: record.selfDeclarationTextAgreedTo,
    state: gatewayToken.state,
    expiry: gatewayToken.expiryTime,
    ...additionalAuditInformation,
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

  private getGatewayTokenOrError(
    gatewayTokenKey: PublicKey
  ): Promise<GatewayToken> {
    return getGatewayToken(this.connection, gatewayTokenKey).then(
      (gatewayToken) => {
        if (!gatewayToken)
          throw new Error(
            "Error retrieving gateway token at address " + gatewayTokenKey
          );
        return gatewayToken;
      }
    );
  }

  private async issueVanilla(
    owner: PublicKey,
    seed?: Uint8Array
  ): Promise<GatewayToken> {
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

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  async issue(recipient: PublicKey, pii: PII): Promise<GatewayToken> {
    const gatewayToken = await this.issueVanilla(recipient);
    const record: AuditRecord = {
      timestamp: new Date().toISOString(),
      token: gatewayToken.publicKey.toBase58(),
      ...pii,
      name: pii.name || "-",
      ipAddress: pii.ipDetails?.ipAddress || "-",
      country: pii.ipDetails?.country || "-",
      selfDeclarationTextAgreedTo: pii.selfDeclarationTextAgreedTo || "-",
      state: gatewayToken.state,
      expiry: gatewayToken.expiryTime,
    };

    await this.recorder.store(record);

    return gatewayToken;
  }

  async revoke(
    gatewayTokenKey: PublicKey,
    additionalAuditInformation: Partial<AuditRecord> = {}
  ): Promise<GatewayToken> {
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

    const gatewayToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    await updateRecordWithToken(
      this.recorder,
      gatewayToken,
      additionalAuditInformation
    );

    return gatewayToken;
  }

  async freeze(
    gatewayTokenKey: PublicKey,
    additionalAuditInformation: Partial<AuditRecord> = {}
  ): Promise<GatewayToken> {
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

    const gatewayToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    await updateRecordWithToken(
      this.recorder,
      gatewayToken,
      additionalAuditInformation
    );

    return gatewayToken;
  }

  async unfreeze(
    gatewayTokenKey: PublicKey,
    additionalAuditInformation: Partial<AuditRecord> = {}
  ): Promise<GatewayToken> {
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

    const gatewayToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    await updateRecordWithToken(
      this.recorder,
      gatewayToken,
      additionalAuditInformation
    );

    return gatewayToken;
  }

  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    additionalAuditInformation: Partial<AuditRecord> = {}
  ): Promise<GatewayToken> {
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

    const gatewayToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    await updateRecordWithToken(
      this.recorder,
      gatewayToken,
      additionalAuditInformation
    );

    return gatewayToken;
  }
}
