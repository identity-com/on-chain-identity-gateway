import { Provider, web3 } from "@project-serum/anchor";
import { deriveATA, deriveDelegateAndBumpSeed } from "./lib/util";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export type DelegateParams = {
  dappProvider: Provider;
  oracle: web3.PublicKey;
  token: web3.PublicKey;
  dappTokenAccount?: web3.PublicKey; // defaults to the ATA derived from the dApp
};

export const delegate = async (
  params: DelegateParams
): Promise<web3.PublicKey> => {
  const dappPublicKey = params.dappProvider.wallet.publicKey;

  const dappTokenAccount =
    params.dappTokenAccount || (await deriveATA(dappPublicKey, params.token));

  const [delegate] = await deriveDelegateAndBumpSeed(
    dappPublicKey,
    params.oracle
  );

  const setDelegateInstruction = Token.createApproveInstruction(
    TOKEN_PROGRAM_ID,
    dappTokenAccount,
    delegate,
    dappPublicKey,
    [],
    999_999_999_999 // TODO can we make this infinite?
  );

  await params.dappProvider.send(
    new web3.Transaction().add(setDelegateInstruction)
  );

  return delegate;
};
