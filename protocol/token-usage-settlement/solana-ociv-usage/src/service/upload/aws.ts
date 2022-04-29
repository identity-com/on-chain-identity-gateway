import { createGzip } from "zlib";
import { PassThrough } from "stream";
import * as AWS from "aws-sdk";
import { PublicKey } from "@solana/web3.js";
import { Uploader } from "./index";

const s3 = new AWS.S3();

interface AWSConfig {
  bucket?: string;
  folder?: string;
}

const validateConfig = (awsConfig: AWSConfig) => {
  if (!awsConfig.bucket || !awsConfig.folder)
    throw new Error("A bucket & folder needs to be provided");
};

export default {
  getLastSlot: async (
    config: AWSConfig,
    program: PublicKey,
    network: PublicKey
  ): Promise<number | undefined> => {
    validateConfig(config);

    const prefix = `${
      config.folder
    }/${program.toBase58()}_${network.toBase58()}_`;

    const objects = await s3
      .listObjects({ Bucket: config.bucket as string, Prefix: prefix })
      .promise();

    // extract the last slot numbers from the file, sort and get the latest
    return objects?.Contents?.map((object) => {
      const match = object?.Key?.match(
        /^([^_]+)_([^_]+)_([^_]+)_([^.]+).\csv\.gz$/
      );

      return match ? parseInt(match[4]) : undefined;
    })
      .filter((slot) => slot)
      .sort((a, b) => (b as number) - (a as number))
      .find((slot, index) => index === 0);
  },
  /**
   * Creates an upload stream for writing directly to S3
   */
  createUploadStream: (config: AWSConfig, filename: string) => {
    validateConfig(config);

    const output = new PassThrough().pipe(createGzip());

    s3.upload({
      Bucket: config.bucket as string,
      Key: `${config.folder}/${filename}`,
      Body: output,
    })
      .promise()
      .then(() => {
        console.log("AWS upload complete");
      });

    return output;
  },
} as Uploader;
