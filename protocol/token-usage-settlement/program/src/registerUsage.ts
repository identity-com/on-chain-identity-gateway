import { BN, Provider, web3 } from "@project-serum/anchor";
import { deriveUsageAccount, fetchProgram } from "./lib/util";

export type RegisterUsageParams = {
  epoch: number;
  oracleProvider: Provider;
  dapp: web3.PublicKey;
  gatekeeper: web3.PublicKey;
  amount: number;
};
export const registerUsage = async (
  params: RegisterUsageParams
): Promise<web3.PublicKey> => {
  const oraclePublicKey = params.oracleProvider.wallet.publicKey;

  const [usageAccount, bump] = await deriveUsageAccount(
    params.dapp,
    params.gatekeeper,
    oraclePublicKey,
    params.epoch
  );

  const program = await fetchProgram(params.oracleProvider);
  await program.rpc.registerUsage(
    new BN(params.amount),
    new BN(params.epoch),
    bump,
    {
      accounts: {
        usage: usageAccount,
        dapp: params.dapp,
        gatekeeper: params.gatekeeper,
        oracle: oraclePublicKey,
        systemProgram: web3.SystemProgram.programId,
      },
    }
  );

  return usageAccount;
};
