use {
    crate::ErrorCode,
    anchor_lang::{
        prelude::{AccountInfo, ProgramResult},
        solana_program::{
            program::invoke_signed
        },
    },
};

/// Parameters for an SPL Token transfer CPI
pub struct TokenTransferParams<'a: 'b, 'b> {
    /// the source token account
    pub source: AccountInfo<'a>,
    /// the destination token account
    pub destination: AccountInfo<'a>,
    /// the amount of tokens to transfer
    pub amount: u64,
    /// the owner of the source account
    pub authority: AccountInfo<'a>,
    /// if the source authority is a PDA, the signer seeds for the account
    pub authority_signer_seeds: &'b [&'b [u8]],
    /// the SPL Token program
    pub token_program: AccountInfo<'a>,
}

#[inline(always)]
pub fn spl_token_transfer(params: TokenTransferParams<'_, '_>) -> ProgramResult {
    let TokenTransferParams {
        source,
        destination,
        authority,
        token_program,
        amount,
        authority_signer_seeds,
    } = params;

    let result = invoke_signed(
        &spl_token::instruction::transfer(
            token_program.key,
            source.key,
            destination.key,
            authority.key,
            &[],
            amount,
        )?,
        &[source, destination, authority, token_program],
        &[authority_signer_seeds],
    );

    result.map_err(|_| ErrorCode::TokenTransferFailed.into())
}
