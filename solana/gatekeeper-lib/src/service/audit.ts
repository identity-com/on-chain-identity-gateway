import { PublicKey } from "@solana/web3.js";
import { AuditRecord, Recorder, RecorderFS } from "../util/record";

export class AuditService {
  constructor(private recorder: Recorder = new RecorderFS()) {}

  async audit(gatewayToken: PublicKey): Promise<AuditRecord | null> {
    return this.recorder.lookup(gatewayToken);
  }
}
