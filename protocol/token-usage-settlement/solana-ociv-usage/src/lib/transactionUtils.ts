import {
  Connection,
  Keypair,
  ParsedConfirmedTransaction,
  PublicKey, SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { complement, isNil } from "ramda";

export type SerumType = "PlaceOrder";
export type NFTType = "Mint";
export type DummyType = "DummyTx" | "NativeTransferTx";

export type Category = "Serum" | "NFT" | "Dummy" | "NativeTransfer";

type Subtype<C extends Category> = C extends "Serum"
  ? SerumType
  : C extends "NFT"
  ? NFTType
  : DummyType;

export type BillableTransaction<C extends Category> = {
  programId: PublicKey;
  dapp: PublicKey;
  category: C;
  subtype: Subtype<C>;
  signature: string;
  rawTransaction: ParsedConfirmedTransaction;
};

const isNotNil = complement(isNil);

export const buildBillableTransaction = <C extends Category>(
  programId: PublicKey,
  dapp: PublicKey,
  category: C,
  subtype: Subtype<C>,
  signature: string,
  rawTransaction: ParsedConfirmedTransaction
): BillableTransaction<C> => ({
  programId,
  dapp,
  category,
  subtype,
  signature,
  rawTransaction,
});

interface Strategy<C extends Category> {
  matches(transaction: ParsedConfirmedTransaction): boolean;
  build(transaction: ParsedConfirmedTransaction): BillableTransaction<C>;
}

// abstract class SerumStrategy implements Strategy<"Serum"> {
//   // Dex Market Proxy program deployed by Solrise
//   static proxyProgramId = new PublicKey(
//     "D3z8BLmMnPD1LaKwCkyCisM7iDyw9PsXXmvatUwjCuqT"
//   );
//
//   matches(transaction: ParsedConfirmedTransaction): boolean {
//     return transaction.transaction.message.instructions.some((instruction) => {
//       if (!instruction.programId.equals(this.programId)) return false;
//
//       // TODO
//       // check the type. This is pseudocode - best to run it and see what happens
//       // my hypothesis is that the validators recognise serum txes and return parsed data
//       // if not, we will need to parse the tx ourselves
//       // I have included the serum-ts library for this purpose
//       if (instruction.parsed && instruction.parsed.type === "PlaceOrder") {
//         return true;
//       }
//
//       return true;
//     });
//   }
//
//   build(
//     parsedConfirmedTransaction: ParsedConfirmedTransaction
//   ): BillableTransaction<"Serum"> {
//     return buildBillableTransaction(
//       this.programId,
//       SerumStrategy.proxyProgramId,
//       "Serum",
//       "PlaceOrder",
//       "", // TODO something like parsedConfirmedTransaction.transaction.signature(),
//       parsedConfirmedTransaction
//     );
//   }
//   constructor(
//     private readonly programId: PublicKey,
//     private readonly dapp: PublicKey
//   ) {}
// }


export class NativeTransferStrategy implements Strategy<"NativeTransfer"> {
  matches(parsedConfirmedTransaction: ParsedConfirmedTransaction): boolean {
    // TODO Parse instructions in more Detail
    return parsedConfirmedTransaction.transaction.message.instructions.length === 1 &&
      parsedConfirmedTransaction.transaction.message.instructions[0].programId === SystemProgram.programId
  }

  build(
    parsedConfirmedTransaction: ParsedConfirmedTransaction
  ): BillableTransaction<"NativeTransfer"> {
    return buildBillableTransaction(
      parsedConfirmedTransaction.transaction.message.instructions[0].programId,
      Keypair.generate().publicKey, // TODO
      "NativeTransfer",
      "NativeTransferTx",
      parsedConfirmedTransaction.transaction.signatures[0],
      parsedConfirmedTransaction
    );
  }
}


export class DummyStrategy implements Strategy<"Dummy"> {
  matches(parsedConfirmedTransaction: ParsedConfirmedTransaction): boolean {
    return true;
  }

  build(
    parsedConfirmedTransaction: ParsedConfirmedTransaction
  ): BillableTransaction<"Dummy"> {
    return buildBillableTransaction(
      parsedConfirmedTransaction.transaction.message.instructions[0].programId,
      Keypair.generate().publicKey, // TODO
      "Dummy",
      "DummyTx",
      "TODO", // TODO
      parsedConfirmedTransaction
    );
  }
}

export const loadTransactions = async (
  connection: Connection,
  signatures: string[],
  strategies: Strategy<any>[]
): Promise<BillableTransaction<any>[]> => {
  console.log(signatures)

  const transactions = await connection.getParsedConfirmedTransactions(
    signatures
  );

  console.log(transactions)

  const buildFromStrategies = (
    transaction: ParsedConfirmedTransaction | null
  ) => {
    if (!transaction) return null;
    const strategy = strategies.find((strategy) =>
      strategy.matches(transaction)
    );
    if (!strategy) return null;
    return strategy.build(transaction);
  };

  return transactions
    .map(buildFromStrategies)
    .filter(isNotNil) as BillableTransaction<any>[];
};
