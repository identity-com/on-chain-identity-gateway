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
    network?: PublicKey
  ): Promise<number | undefined> => {
    validateConfig(config);

    let prefix;
    if (network) {
      prefix = `${config.folder}/${program.toBase58()}_${network.toBase58()}_`;
    } else {
      prefix = `${config.folder}/${program.toBase58()}_`;
    }

    let lastSlot: number | undefined;

    // loop through the listObject results. continuationToken will store the "paging" parameter required
    let continuationToken: string | undefined;
    do {
      const objects = await s3
        .listObjectsV2({
          Bucket: config.bucket as string,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
        .promise();

      objects.Contents?.forEach((object) => {
        const match = object?.Key?.match(
          /^[^_]+_[^_]+_[^_]+_([^.]+)\.csv\.gz$/
        );

        if (match) {
          const foundSlot = parseInt(match[1]);

          if (!lastSlot || lastSlot < foundSlot) {
            lastSlot = foundSlot;
          }
        }
      });

      continuationToken = objects.NextContinuationToken;
    } while (continuationToken);

    return lastSlot;
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
