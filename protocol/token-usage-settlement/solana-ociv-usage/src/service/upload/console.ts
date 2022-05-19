import { Uploader } from "./index";
import { PassThrough } from "stream";

export default {
  /**
   * Always returns undefined as there is nothing to reference
   */
  getLastSlot: async (): Promise<number | undefined> => {
    return undefined;
  },

  /**
   * Creates a simple output stream that writes to stdout
   */
  createUploadStream: (): NodeJS.WritableStream => {
    const pt = new PassThrough();
    pt.on("data", (data: Buffer) => {
      process.stdout.write(data);
    });

    return pt;
  },
} as Uploader;
