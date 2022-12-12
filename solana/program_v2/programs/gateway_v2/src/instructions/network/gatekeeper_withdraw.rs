use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use crate::util::create_and_invoke_transfer;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use std::str::FromStr;

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>, mut amount: u64) -> Result<()> {
    // Amount 0 means withdraw all
    if amount == 0 {
        amount = ctx.accounts.gatekeeper_token_account.amount;
    }
    let authority = &mut ctx.accounts.authority;
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let receiver_token_account = &mut ctx.accounts.receiver_token_account;
    let gatekeeper_token_account = &mut ctx.accounts.gatekeeper_token_account;
    let mint_account = &mut ctx.accounts.mint_account;
    let gatekeeper_pda = &mut ctx.accounts.gatekeeper_pda;

    let gatekeeper_pda_key = gatekeeper_pda.key().clone();
    let spl_token_program_key = spl_token_program.key().clone();
    let mint_account_key = mint_account.key().clone();
    let bump = &mut gatekeeper.gatekeeper_bump.to_le_bytes();
    msg!(gatekeeper_pda_key, spl_token_program_key, mint_account_key);

    let authority_seed = &[
        gatekeeper_pda_key.as_ref(),
        spl_token_program_key.as_ref(),
        mint_account_key.as_ref(),
        bump,
    ][..];

    // Output the pda, should be the same as the gatekeeper_token_account

    // Turn "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" into a Pubkey
    let ASSOCIATED_TOKEN_PROGRAM_ID =
        Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").unwrap();

    // let key = Pubkey::create_program_address(authority_seed.clone(), &ASSOCIATED_TOKEN_PROGRAM_ID)
    //     .unwrap();
    let (key, auth) =
        Pubkey::try_find_program_address(authority_seed.clone(), &ASSOCIATED_TOKEN_PROGRAM_ID)
            .unwrap();

    // msg!(
    //     "ASSOCIATED_TOKEN_PROGRAM_ID: {}",
    //     ASSOCIATED_TOKEN_PROGRAM_ID.to_string(),
    // );
    // msg!("Program address: {}", key.to_string());
    // msg!(
    //     "gatekeeper ATA: {}",
    //     gatekeeper_token_account.key().to_string()
    // );
    // msg!("gatekeeper_pda_key: {}", gatekeeper_pda_key);

    let transfer_instruction = Transfer {
        from: gatekeeper_token_account.to_account_info(),
        to: receiver_token_account.to_account_info(),
        authority: authority.to_account_info(),
    };
    // msg!("Post Transfer");

    let signer = &[authority_seed][..];

    let cpi_ctx = CpiContext::new_with_signer(
        spl_token_program.to_account_info(),
        transfer_instruction,
        signer,
    );
    // msg!("Post new_with_signer");

    anchor_spl::token::transfer(cpi_ctx, amount)?;
    // msg!("Post cpi");

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct GatekeeperWithdrawAccount<'info> {
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: PDA IS THE PDA OF THE GATEKEEPER
    pub gatekeeper_pda: UncheckedAccount<'info>,
    /// CHECK: Receiver destination account does not need to satisfy the any constraints.
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    pub mint_account: Account<'info, Mint>,
    pub receiver_token_account: Account<'info, TokenAccount>,
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
