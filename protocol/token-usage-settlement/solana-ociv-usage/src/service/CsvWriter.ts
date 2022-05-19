import { BillableInstruction } from "../util/transactionUtils";

export const format_time = (s: number | null | undefined): string => {
  if (!s) return "";

  return new Date(s * 1e3).toISOString();
};

export const printCSV = (
  output: NodeJS.WritableStream,
  instructions: BillableInstruction[]
) => {
  // write output
  // header
  output.write(
    `Identifier,Timestamp,Program Name,Program Address,Gatekeeper Network Address,Instruction Name,Signature,Result,Gateway Token Address,Wallet Address,Total Instructions,Instruction Position\n`
  );

  // data
  instructions.forEach((row) => {
    const string =
      `${row.txSignature}-${row.instructionIndex},` +
      `${format_time(row.rawTransaction.blockTime)},` +
      `${row.progamName},` +
      `${row.programAddress.toBase58()},` +
      `${row.networkAddress.toBase58()},` +
      `${row.instructionName},` +
      `${row.txSignature},` +
      `${row.rawTransaction.meta?.err ? "ERROR" : "SUCCESS"},` +
      `${row.gatewayToken.toBase58()},` +
      `${row.ownerAddress.toBase58()},` +
      `${row.rawTransaction.transaction.message.instructions.length},` +
      `${row.instructionIndex}\n`;

    output.write(string);
  });
};
