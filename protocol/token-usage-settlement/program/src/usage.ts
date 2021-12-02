import { BN, Program, Provider, web3 } from "@project-serum/anchor";
import { deriveUsageAccount, fetchProgram } from "./lib/util";
import { Usage } from "../target/types/usage";

export type RegisterUsageParams = {
  epoch: number;
  oracleProvider: Provider;
  dapp: web3.PublicKey;
  gatekeeper: web3.PublicKey;
  amount: number;
  program?: Program<Usage>;
};

export type UsageRecord = {
  id: web3.PublicKey;
  epoch: number;
  dapp: web3.PublicKey;
  gatekeeper: web3.PublicKey;
  oracle: web3.PublicKey;
  amount: number;
  paid: boolean;
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

  const program = await fetchProgram(params.oracleProvider, params.program);
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

export const getUsage = async (
  params: Omit<RegisterUsageParams, "oracleProvider"> & {
    oracle: web3.PublicKey;
    provider: Provider;
  }
): Promise<UsageRecord> => {
  const [usageAccount] = await deriveUsageAccount(
    params.dapp,
    params.gatekeeper,
    params.oracle,
    params.epoch
  );

  const program = await fetchProgram(params.provider, params.program);
  const usage = await program.account.usage.fetch(usageAccount);

  return {
    ...usage,
    id: usageAccount,
    epoch: usage.epoch.toNumber(),
    paid: usage.paid as boolean,
  };
};
