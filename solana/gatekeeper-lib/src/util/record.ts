import * as fs from "fs";
import { REGISTER } from "./constants";
import { PublicKey } from "@solana/web3.js";
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
