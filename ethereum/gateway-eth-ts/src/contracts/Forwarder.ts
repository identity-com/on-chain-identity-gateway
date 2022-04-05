import { Contract, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { EIP712Message } from "../utils/signer";

export class Forwarder {
  contract: Contract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.Forwarder,
      signerOrProvider
    );
  }

  execute = (request: EIP712Message, signature: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return this.contract.execute(request, signature);
  };
}
