import { Wallet, getDefaultProvider, Contract, BigNumber } from "ethers";
import { BaseProvider } from "@ethersproject/providers";
import { DEFAULT_CHAIN_ID, NETWORKS } from "./constants";
import { TypedDataField } from "@ethersproject/abstract-signer";
import * as fs from "node:fs";
import { getProvider } from "./providers";

export const privateKeySigner = function (
  privateKey: string,
  provider?: BaseProvider,
  networkId?: number
): Wallet {
  if (!provider && networkId) {
    provider = getProvider(NETWORKS[networkId]);
  }

  return new Wallet(privateKey, provider);
};

export const readPrivateKey = (
  file: string,
  networkId: number = DEFAULT_CHAIN_ID
): Wallet => {
  const privateKey = JSON.parse(
    fs.readFileSync(file).toString("utf-8")
  ) as string;
  const provider = getDefaultProvider(NETWORKS[networkId]);

  return new Wallet(privateKey, provider);
};

export const mnemonicSigner = function (
  mnemonic: string,
  provider?: BaseProvider,
  networkId?: number
): Wallet {
  let signer = Wallet.fromMnemonic(mnemonic);

  if (provider) {
    signer = signer.connect(provider);
  } else if (!provider && networkId) {
    provider = getProvider(NETWORKS[networkId]);
    signer = signer.connect(provider);
  }

  return signer;
};

type Input = {
  from: string;
  to: string;
  data: string;
};

const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

export interface EIP712Message {
  [key: string]: any;
}

interface SignedMetaTxRequest {
  signature: string;
  request: EIP712Message;
}

interface EIP712TypeProperty {
  name: string;
  type: string;
}

interface EIP712Types {
  [name: string]: ReadonlyArray<EIP712TypeProperty>;
}

interface EIP712Domain {
  name?: string | undefined;
  version?: string | undefined;
  chainId?: string | number | undefined;
  verifyingContract?: string | undefined;
  salt?: string | undefined;
}

export interface EIP712TypedData {
  types: EIP712Types;
  primaryType: string;
  domain: EIP712Domain;
  message: EIP712Message;
}

const getMetaTxTypeData = (
  chainId: number,
  verifyingContract: string
): Omit<EIP712TypedData, "message"> => ({
  types: {
    EIP712Domain,
    ForwardRequest,
  },
  domain: {
    name: "MinimalForwarder",
    version: "0.0.1",
    chainId,
    verifyingContract,
  },
  primaryType: "ForwardRequest",
});

async function signTypedData(signer: Wallet, data: EIP712TypedData) {
  const types = { ForwardRequest } as Record<string, Array<TypedDataField>>;
  return signer._signTypedData(data.domain, types, data.message);
}

const buildRequest = async (
  forwarder: Contract,
  input: Input
): Promise<EIP712Message> => {
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
  signer: Wallet,
  forwarder: Contract,
  input: Input
): Promise<SignedMetaTxRequest> => {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedData(signer, toSign);
  return { signature, request };
};
