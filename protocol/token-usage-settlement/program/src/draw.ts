import { Program, Provider, web3 } from "@project-serum/anchor";
import {
  deriveATA,
  deriveDelegateAndBumpSeed,
  deriveUsageAccount,
  fetchProgram,
} from "./lib/util";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { UsageRecord } from "./usage";
import { Usage } from "../target/types/usage";

export type DrawParams = {
  epoch: number;
  gatekeeperProvider: Provider;
  dapp: web3.PublicKey;
  oracle: web3.PublicKey;
  token: web3.PublicKey;
  dappTokenAccount?: web3.PublicKey; // defaults to the ATA derived from the dApp
  gatekeeperTokenAccount?: web3.PublicKey; // defaults to the ATA derived from the gatekeeperProvider
  program?: Program<Usage>;
};
export const draw = async (params: DrawParams): Promise<UsageRecord> => {
  const gatekeeperPublicKey = params.gatekeeperProvider.wallet.publicKey;

  const dappTokenAccount =
    params.dappTokenAccount || (await deriveATA(params.dapp, params.token));

  const gatekeeperTokenAccount =
    params.gatekeeperTokenAccount ||
    (await deriveATA(gatekeeperPublicKey, params.token));

  const [usageAccount] = await deriveUsageAccount(
    params.dapp,
    gatekeeperPublicKey,
    params.oracle,
    params.epoch
  );

  const [delegate, delegate_bump] = await deriveDelegateAndBumpSeed(
    params.dapp,
    params.oracle
  );

  const program = await fetchProgram(params.gatekeeperProvider, params.program);
  await program.rpc.draw(delegate_bump, {
    accounts: {
      usage: usageAccount,
      gatekeeper: gatekeeperPublicKey,
      gatekeeperTokenAccount,
      dappTokenAccount,
      delegateAuthority: delegate,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  });

  const usage = await program.account.usage.fetch(usageAccount);

  return {
    ...usage,
    id: usageAccount,
    epoch: usage.epoch.toNumber(),
    paid: usage.paid as boolean,
  };
};
