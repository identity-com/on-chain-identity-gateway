import { BillableInstruction } from "../util/transactionUtils";

export const format_time = (s: number | null | undefined): string => {
  if (!s) return "";

  return new Date(s * 1e3).toISOString();
};

export const printCSV = (instructions: BillableInstruction[]) => {
  // write output
  // header
  console.log(
    `Timestamp,Program Name,Instruction Name,Signature,Result,Gateway Token,Owner Token,Total Instructions`
  );

  // data
  instructions.forEach((row) => {
    console.log(
      "%s,%s,%s,%s,%s,%s,%s,%s",
      format_time(row.rawTransaction.blockTime),
      row.progamName,
      row.instructionName,
      row.txSignature,
      row.rawTransaction.meta?.err ? "ERROR" : "SUCCESS",
      row.gatewayToken.toBase58(),
      row.ownerAddress.toBase58(),
      row.rawTransaction.transaction.message.instructions.length
    );
  });
};
