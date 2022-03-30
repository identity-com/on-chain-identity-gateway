import {
  Connection,
  ParsedConfirmedTransaction,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import * as R from "ramda";
import { InstructionConfig, UsageConfig } from "../service/config";
import * as base58 from "bs58";

export type BillableInstruction = {
  txSignature: string;
  programId: PublicKey;
  progamName: string;
  programAddress: PublicKey;
  networkAddress: PublicKey;
  instructionName: string;
  instructionIndex: number;
  rawInstruction: PartiallyDecodedInstruction;
  rawTransaction: ParsedConfirmedTransaction;
  gatewayToken: PublicKey;
  ownerAddress: PublicKey;
};

const isNotNil = R.complement(R.isNil);

export const buildBillableInstruction = (
  txSignature: string,
  programId: PublicKey,
  progamName: string,
  programAddress: PublicKey,
  networkAddress: PublicKey,
  instructionName: string,
  instructionIndex: number,
  rawInstruction: PartiallyDecodedInstruction,
  rawTransaction: ParsedConfirmedTransaction,
  gatewayToken: PublicKey,
  ownerAddress: PublicKey
): BillableInstruction => ({
  txSignature,
  programId,
  progamName,
  programAddress,
  networkAddress,
  instructionName,
  instructionIndex,
  rawInstruction,
  rawTransaction,
  gatewayToken,
  ownerAddress,
});

const matchInstruction = (
  instruction: PartiallyDecodedInstruction,
  config: UsageConfig
): InstructionConfig | undefined => {
  const data = Uint8Array.from(base58.decode(instruction.data));

  // console.log(`matchInstruction Program: ${instruction.programId}`);
  // console.log(`matchInstruction Data: ${data}`);
  // console.log(
  //   `matchInstruction Accounts: ${R.map((a: PublicKey) => a.toBase58())(
  //     instruction.accounts
  //   )}`
  // );

  if (
    data.length < config.mask[1] ||
    !config.program.equals(instruction.programId)
  ) {
    return;
  }
  const determ = Buffer.from(
    data.subarray(config.mask[0], config.mask[1])
  ).toString("hex");

  return config.instructions[determ];
};

interface Strategy {
  matches(transaction: ParsedConfirmedTransaction): boolean;
  build(transaction: ParsedConfirmedTransaction): BillableInstruction[];
}

export class ConfigBasedStrategy implements Strategy {
  private readonly config: UsageConfig;

  constructor(config: UsageConfig) {
    this.config = config;
  }

  matches(transaction: ParsedConfirmedTransaction): boolean {
    return R.pipe(
      R.filter(
        (i: ParsedInstruction | PartiallyDecodedInstruction): boolean =>
          "data" in i
      ),
      R.map((i: PartiallyDecodedInstruction) =>
        matchInstruction(i, this.config)
      ),
      R.any(isNotNil)
    )(transaction.transaction.message.instructions);
  }

  build(transaction: ParsedConfirmedTransaction): BillableInstruction[] {
    return R.pipe(
      // Add Index
      R.addIndex(R.map)((val, idx) => [val, idx]),
      // Filter out ParsedInstruction
      R.filter(
        ([i]: [ParsedInstruction | PartiallyDecodedInstruction]): boolean =>
          "data" in i
      ),
      // Find matching InstructionConfig (or undefined)
      R.map(([i, idx]: [PartiallyDecodedInstruction, number]) => [
        matchInstruction(i, this.config),
        i,
        idx,
      ]),
      // Filter undefined InstructionConfig
      R.filter(([match]) => isNotNil(match)),
      // Build BillableInstruction
      R.map(
        ([match, i, idx]: [
          InstructionConfig,
          PartiallyDecodedInstruction,
          number
        ]) =>
          buildBillableInstruction(
            transaction.transaction.signatures[0],
            i.programId,
            this.config.name,
            this.config.program,
            this.config.network,
            match.name,
            idx,
            i,
            transaction,
            i.accounts[match.gatewayTokenPosition],
            i.accounts[match.ownerPosition]
          )
      )
    )(transaction.transaction.message.instructions);
  }
}

export const loadTransactions = async (
  connection: Connection,
  signatures: string[],
  strategies: Strategy[]
): Promise<BillableInstruction[]> => {
  const transactions = await connection.getParsedConfirmedTransactions(
    signatures
  );

  const buildFromStrategies = (
    transaction: ParsedConfirmedTransaction | null
  ): BillableInstruction[] => {
    if (!transaction) return [];
    const strategy = strategies.find((strategy) =>
      strategy.matches(transaction)
    );
    if (!strategy) return [];
    return strategy.build(transaction);
  };

  return transactions.map(buildFromStrategies).flat();
};
