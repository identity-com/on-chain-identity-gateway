/* Autogenerated file. Do not edit manually. */
// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  GatewayTokenERC2771ClientTest,
  GatewayTokenERC2771ClientTestInterface,
} from "../../../../test/contracts/GatewayTokenClientERC2711Test.sol/GatewayTokenERC2771ClientTest";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "gatewayTokenContract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "gatekeeperNetwork",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "gatewayToken",
        type: "address",
      },
    ],
    name: "IsGated__InvalidGatewayToken",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "Success",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "forwarder",
        type: "address",
      },
    ],
    name: "isTrustedForwarder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "testGated",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516102cd3803806102cd83398101604081905261002f91610058565b603480546001600160a01b0319166001600160a01b039390931692909217909155603555610092565b6000806040838503121561006b57600080fd5b82516001600160a01b038116811461008257600080fd5b6020939093015192949293505050565b61022c806100a16000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063572b6c051461003b578063968f76bd1461007b575b600080fd5b6100676100493660046101a4565b6001600160a01b031660009081526033602052604090205460ff1690565b604051901515815260200160405180910390f35b610083610085565b005b6034546001600160a01b03168063ff17e23261009f61017a565b6035546040516001600160e01b031960e085901b1681526001600160a01b039092166004830152602482015260440160206040518083038186803b1580156100e657600080fd5b505afa1580156100fa573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061011e91906101d4565b61014e576034546040516355ec9bfb60e11b81526001600160a01b03909116600482015260240160405180910390fd5b6040517f395a9ab3d1230297d931e1fa224ca597ca0e45f620c1aeb74b512bfcc6f66aab90600090a150565b3360009081526033602052604081205460ff161561019f575060131936013560601c90565b503390565b6000602082840312156101b657600080fd5b81356001600160a01b03811681146101cd57600080fd5b9392505050565b6000602082840312156101e657600080fd5b815180151581146101cd57600080fdfea2646970667358221220f93d6dcff93e5dd934b5c0af40cbb211f8e680362bedc0c49856d5f063d5877564736f6c63430008090033";

type GatewayTokenERC2771ClientTestConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: GatewayTokenERC2771ClientTestConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class GatewayTokenERC2771ClientTest__factory extends ContractFactory {
  constructor(...args: GatewayTokenERC2771ClientTestConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    gatewayTokenContract: PromiseOrValue<string>,
    gatekeeperNetwork: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<GatewayTokenERC2771ClientTest> {
    return super.deploy(
      gatewayTokenContract,
      gatekeeperNetwork,
      overrides || {}
    ) as Promise<GatewayTokenERC2771ClientTest>;
  }
  override getDeployTransaction(
    gatewayTokenContract: PromiseOrValue<string>,
    gatekeeperNetwork: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      gatewayTokenContract,
      gatekeeperNetwork,
      overrides || {}
    );
  }
  override attach(address: string): GatewayTokenERC2771ClientTest {
    return super.attach(address) as GatewayTokenERC2771ClientTest;
  }
  override connect(signer: Signer): GatewayTokenERC2771ClientTest__factory {
    return super.connect(signer) as GatewayTokenERC2771ClientTest__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GatewayTokenERC2771ClientTestInterface {
    return new utils.Interface(_abi) as GatewayTokenERC2771ClientTestInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GatewayTokenERC2771ClientTest {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as GatewayTokenERC2771ClientTest;
  }
}