import { Provider, web3 } from "@project-serum/anchor";
import { deriveATA, deriveDelegateAndBumpSeed } from "./lib/util";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export type DelegateParams = {
  dappProvider: Provider;
  oracle: web3.PublicKey;
  token: web3.PublicKey;
  dappTokenAccount?: web3.PublicKey; // defaults to the ATA derived from the dApp
  amount?: number;
};

export type DelegateResult = {
  delegateAccount: web3.PublicKey;
  tokenAccount: web3.PublicKey;
};

export const delegate = async (
  params: DelegateParams
): Promise<DelegateResult> => {
  const dappPublicKey = params.dappProvider.wallet.publicKey;

  const dappTokenAccount =
    params.dappTokenAccount || (await deriveATA(dappPublicKey, params.token));

  const [delegate] = await deriveDelegateAndBumpSeed(
    dappPublicKey,
    params.oracle
  );

  const amount = params.amount || 999_999_999_999; // TODO can we make this infinite?
  const setDelegateInstruction = Token.createApproveInstruction(
    TOKEN_PROGRAM_ID,
    dappTokenAccount,
    delegate,
    dappPublicKey,
    [],
    amount
  );

  await params.dappProvider.send(
    new web3.Transaction().add(setDelegateInstruction)
  );

  return {
    delegateAccount: delegate,
    tokenAccount: dappTokenAccount,
  };
};
