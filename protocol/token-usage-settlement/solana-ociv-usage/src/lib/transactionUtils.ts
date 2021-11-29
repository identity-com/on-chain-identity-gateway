import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export type SerumType = "PlaceOrder";
export type NFTType = "Mint";

export type Category = "Serum" | "NFT";

type Subtype<C extends Category> = C extends "Serum" ? SerumType : NFTType;

export type BillableTransaction<C extends Category> = {
  programId: PublicKey;
  dapp: PublicKey;
  category: C;
  subtype: Subtype<C>;
  signature: string;
  rawTransaction: Transaction;
};

const isNotNil = complement(isNil);

export const buildBillableTransaction = <C extends Category>(
  programId: PublicKey,
  dapp: PublicKey,
  category: C,
  subtype: Subtype<C>,
  signature: string
): BillableTransaction<C> => ({
  programId,
  dapp,
  category,
  subtype,
  signature,
});

interface Strategy<C extends Category> {
  category: C;
  subType: Subtype<C>;
  matches(transaction: Transaction): boolean;
  build(transaction: Transaction): BillableTransaction<C>;
}

abstract class SerumStrategy implements Strategy<"Serum"> {
  // Dex Market Proxy program deployed by Solrise
  static proxyProgramId = new PublicKey(
    "D3z8BLmMnPD1LaKwCkyCisM7iDyw9PsXXmvatUwjCuqT"
  );

  category = "Serum" as Category;
  subType = "PlaceOrder";

  matches(transaction: Transaction): boolean {
    return transaction.instructions.some((instruction) =>
      if (!instruction.programId.equals(this.programId)) return false;
      
      
      
      if (instruction. !== 1) return false;
      
    );
  }

  build(transaction: Transaction): BillableTransaction<"Serum"> {
    return buildBillableTransaction(
      this.programId,
      this.dapp,
      this.category,
      this.subType,
      transaction.signature
    );
  }
  constructor(
    private readonly programId: PublicKey,
    private readonly dapp: PublicKey
  ) {}
}

class DummyStrategy implements Strategy<"Dummy"> {
  matches(transaction: Transaction): boolean {
    return true;
  }

  build(transaction: Transaction): BillableTransaction<C> {
    
  } 
}

const loadTransactions = (
  connection: Connection,
  signatures: string[],
  strategies: Strategy<any>[]
): Promise<BillableTransaction<any>[]> => {
  const transactions = await connection.getParsedConfirmedTransactions(signatures);

  const buildFromStrategies = (transaction: Transaction) => {
    const strategy = strategies.find((strategy) => strategy.matches(transaction));
    if (!strategy) return null;
    return strategy.build(transaction);
  };
  
  return transactions
    .map(buildFromStrategies)
    .filter(isNotNull);
  );
};
