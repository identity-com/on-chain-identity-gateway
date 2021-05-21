import * as fs from "fs";
import { REGISTER, REGISTER_BUCKET_S3 } from "./constants";
import { PublicKey } from "@solana/web3.js";
import * as streamToString from "stream-to-string";

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  CreateBucketOutput,
  PutObjectOutput,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import ReadableStream = NodeJS.ReadableStream;
import { State } from "@identity.com/solana-gateway-ts";

export type PII = {
  name?: string;
  ipAddress?: string;
  selfDeclarationTextAgreedTo?: string;
} & Record<string, any>;

export type AuditRecord = {
  timestamp: string;
  token: string;
  name: string;
  ipAddress: string;
  country: string;
  selfDeclarationTextAgreedTo: string;
  state: State;
};

const readRegister = () =>
  fs.promises.readFile(REGISTER).then((file: Buffer) =>
    file
      .toString("utf-8")
      .split("\n")
      .map((line: string) => line.split(","))
  );

export interface Recorder {
  store(record: AuditRecord): Promise<void>;
  lookup(gatewayToken: PublicKey): Promise<AuditRecord | null>;
}

export class DummyRecorder implements Recorder {
  lookup(gatewayToken: PublicKey): Promise<AuditRecord | null> {
    return Promise.resolve(null);
  }

  store(record: AuditRecord): Promise<void> {
    return Promise.resolve(undefined);
  }
}

export class RecorderFS implements Recorder {
  async store(record: AuditRecord) {
    const row =
      [
        record.timestamp,
        record.token,
        record.name,
        record.ipAddress,
        record.country,
        record.selfDeclarationTextAgreedTo,
        record.state,
      ].join(",") + "\n";
    await fs.promises.appendFile(REGISTER, row);
  }

  async lookup(gatewayToken: PublicKey): Promise<AuditRecord | null> {
    const register = await readRegister();

    const entry = register.find(
      (entry: Array<string>) => entry[1] === gatewayToken.toBase58()
    );

    if (!entry) return null;

    const typedStateString = entry[6] as keyof typeof State;
    const state = State[typedStateString] || "-";

    return {
      timestamp: entry[0] || "-",
      token: entry[1] || "-",
      name: entry[2] || "-",
      ipAddress: entry[3] || "-",
      country: entry[4] || "-",
      selfDeclarationTextAgreedTo: entry[5] || "-",
      state,
    };
  }
}

export class RecorderS3 implements Recorder {
  private client: S3Client;

  private bucket: string;

  private directory: string;

  constructor(bucket: string = REGISTER_BUCKET_S3, directory = "dev") {
    this.bucket = bucket;
    this.directory = directory;
    this.client = new S3Client({ region: "us-east-1" });
  }

  private async checkBucketPresent(): Promise<boolean> {
    const command = new HeadBucketCommand({ Bucket: this.bucket });
    return this.client
      .send(command)
      .then((r) => {
        console.log(r);
        return r;
      })
      .then(() => true)
      .catch(() => false);
  }

  private async createBucket(): Promise<CreateBucketOutput> {
    const command = new CreateBucketCommand({ Bucket: this.bucket });
    return this.client.send(command);
  }

  private recordToKey(record: AuditRecord): string {
    return this.directory + "/" + record.token;
  }

  private tokenToKey(token: PublicKey): string {
    return this.directory + "/" + token.toBase58();
  }

  private async putRecord(record: AuditRecord): Promise<PutObjectOutput> {
    const command = new PutObjectCommand({
      Key: this.recordToKey(record),
      Body: JSON.stringify(record),
      Bucket: this.bucket,
    });
    return this.client.send(command);
  }

  private async getRecord(token: PublicKey): Promise<AuditRecord> {
    const command = new GetObjectCommand({
      Key: this.tokenToKey(token),
      Bucket: this.bucket,
    });
    const getObjectResponse = await this.client.send(command);
    if (!getObjectResponse || !getObjectResponse.Body)
      throw new Error("No record found for token " + token.toBase58());

    const recordString = await streamToString(
      getObjectResponse.Body as ReadableStream
    );
    return JSON.parse(recordString) as AuditRecord;
  }

  async store(record: AuditRecord) {
    if (!(await this.checkBucketPresent())) {
      await this.createBucket();
    }

    return this.putRecord(record).then(() => {});
  }

  async lookup(gatewayToken: PublicKey): Promise<AuditRecord | null> {
    return this.getRecord(gatewayToken);
  }
}
