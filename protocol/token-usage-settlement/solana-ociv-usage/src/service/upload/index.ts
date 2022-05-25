import { PublicKey } from "@solana/web3.js";
import AWS from "./aws";
import Console from "./console";

const UPLOADERS: { [key: string]: Uploader } = {
  aws: AWS,
  console: Console,
};

const DEFAULT_UPLOADER = UPLOADERS.console;

export interface Uploader {
  getLastSlot(
    config: any,
    program: PublicKey,
    network?: PublicKey
  ): Promise<number | undefined>;

  createUploadStream(config: any, filename: string): NodeJS.WritableStream;
}

export const getUploader = (type: string | undefined) => {
  if (!type) return DEFAULT_UPLOADER;

  if (!UPLOADERS[type]) throw new Error(`Unknown uploader type ${type}`);

  return UPLOADERS[type];
};
