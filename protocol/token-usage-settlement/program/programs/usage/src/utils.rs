use anchor_lang::prelude::{msg, ProgramError};
use pyth_client::{AccountType, cast, MAGIC, Price, Product, VERSION_2};
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

pub fn get_rate(product: &AccountInfo, price: &AccountInfo) -> Result<i64, ProgramError> {
    let product_info = product;
    let mut product_data = product_info.try_borrow_mut_data()?;
    let product_dst: &mut [u8] = &mut product_data;
    let prod_acct = cast::<Product>( product_dst );

    assert!( prod_acct.px_acc.is_valid(), "not a valid pyth product" );
    let price_info = price;
    let mut price_data = price_info.try_borrow_mut_data()?;
    let price_dst: &mut [u8] = &mut price_data;
    let pa = cast::<Price>( price_dst );

    assert_eq!( pa.magic, MAGIC, "not a valid pyth account" );
    assert_eq!( pa.atype, AccountType::Price as u32,
                "not a valid pyth price account" );
    assert_eq!( pa.ver, VERSION_2,
                "unexpected pyth price account version" );
    msg!( "  price_account .. {:?}", price.key );
    msg!( "    price ... {}", pa.agg.price);
    Ok(pa.agg.price)
}