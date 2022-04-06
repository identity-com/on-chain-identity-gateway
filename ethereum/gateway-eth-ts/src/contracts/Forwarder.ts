import { Contract, Signer } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import abis from "../lib/abis";
import { EIP712Message, ForwarderContract } from "../utils/signer";

export class Forwarder {
  contract: ForwarderContract;

  constructor(signerOrProvider: Signer | BaseProvider, addressOrName: string) {
    this.contract = new Contract(
      addressOrName,
      abis.Forwarder,
      signerOrProvider
    ) as ForwarderContract;
  }

  execute = (request: EIP712Message, signature: string): Promise<boolean> => {
    return this.contract.execute(request, signature);
  };
}
