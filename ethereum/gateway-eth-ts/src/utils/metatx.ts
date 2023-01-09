import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";

import { Forwarder } from "../contracts/typechain-types";
import { EIP712Message, EIP712TypedData } from "eth-sig-util";
import {
  TypedDataField,
  TypedDataSigner,
} from "@ethersproject/abstract-signer";

type Input = {
  from: string;
  to: string;
  data: string;
};

const eip712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const forwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

type ForwardRequest = Input & {
  value: number;
  gas: number;
  nonce: string;
};

const getMetaTxTypeData = (
  chainId: number,
  verifyingContract: string
): Omit<EIP712TypedData, "message"> => ({
  types: {
    EIP712Domain: eip712Domain,
    ForwardRequest: forwardRequest,
  },
  domain: {
    name: "MinimalForwarder",
    version: "0.0.1",
    chainId,
    verifyingContract,
  },
  primaryType: "ForwardRequest",
});

function signTypedData(signer: TypedDataSigner, data: EIP712TypedData) {
  const types = { ForwardRequest: forwardRequest } as Record<
    string,
    Array<TypedDataField>
  >;

  return signer._signTypedData(data.domain, types, data.message);
}

const buildRequest = async (
  forwarder: Forwarder,
  input: Input
): Promise<ForwardRequest> => {
  const nonce = await forwarder
    .getNonce(input.from)
    .then((nonce: BigNumber) => nonce.toString());
  return { value: 0, gas: 2e6, nonce, ...input };
};

const buildTypedData = async (
  forwarder: Contract,
  request: EIP712Message
): Promise<EIP712TypedData> => {
  const chainId = await forwarder.provider.getNetwork().then((n) => n.chainId);
  const typeData = getMetaTxTypeData(chainId, forwarder.address);
  return { ...typeData, message: request };
};

export const signMetaTxRequest = async (
  signer: TypedDataSigner,
  forwarder: Forwarder,
  input: Input
): Promise<{ request: ForwardRequest; signature: string }> => {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedData(signer, toSign);
  return { signature, request };
};
