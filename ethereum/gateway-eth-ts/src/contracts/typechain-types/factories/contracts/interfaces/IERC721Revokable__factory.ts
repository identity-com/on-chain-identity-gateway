/* Autogenerated file. Do not edit manually. */
// @ts-nocheck
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IERC721Revokable,
  IERC721RevokableInterface,
} from "../../../contracts/interfaces/IERC721Revokable";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Revoke",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "revoke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class IERC721Revokable__factory {
  static readonly abi = _abi;
  static createInterface(): IERC721RevokableInterface {
    return new utils.Interface(_abi) as IERC721RevokableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC721Revokable {
    return new Contract(address, _abi, signerOrProvider) as IERC721Revokable;
  }
}
