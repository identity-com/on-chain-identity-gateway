import { BaseContract, BigNumberish, Contract, Signer } from "ethers";

import { IForwarder } from "../contracts/typechain-types";
import { EIP712Message, EIP712TypedData } from "eth-sig-util";
import { TypedDataField } from "@ethersproject/abstract-signer";

type Input = {
  from: string;
  to: string;
  data: string;
  value?: BigNumberish;
  gas: BigNumberish;
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
  value: BigNumberish;
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
    name: "FlexibleNonceForwarder",
    version: "0.0.1",
    chainId,
    verifyingContract,
  },
  primaryType: "ForwardRequest",
});

function signTypedData(signer: Signer, data: EIP712TypedData) {
  const types = { ForwardRequest: forwardRequest } as Record<
    string,
    Array<TypedDataField>
  >;

  return signer.signTypedData(data.domain, types, data.message);
}

const buildRequest = async (
  forwarder: IForwarder,
  input: Input
): Promise<ForwardRequest> => {
  const nonce = await forwarder
    .getNonce(input.from)
    .then((nonce: bigint) => nonce.toString());
  return { value: 0, nonce, ...input };
};

const buildTypedData = async (
  forwarder: BaseContract,
  request: EIP712Message
): Promise<EIP712TypedData> => {
  const chainId = await forwarder.runner.provider
    ?.getNetwork()
    .then((n) => n.chainId);
  const typeData = getMetaTxTypeData(
    Number(chainId),
    await forwarder.getAddress()
  );
  return { ...typeData, message: request };
};

export const signMetaTxRequest = async (
  signer: Signer,
  forwarder: IForwarder,
  input: Input
): Promise<{ request: ForwardRequest; signature: string }> => {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedData(signer, toSign);
  return { signature, request };
};
