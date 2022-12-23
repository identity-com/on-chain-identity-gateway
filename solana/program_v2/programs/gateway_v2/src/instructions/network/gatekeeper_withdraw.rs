use crate::constants::GATEKEEPER_SEED;
use crate::errors::GatekeeperErrors;
use crate::state::{Gatekeeper, GatekeeperKeyFlags};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>, mut amount: u64) -> Result<()> {
    // Amount 0 means withdraw all
    if amount == 0 {
        amount = ctx.accounts.gatekeeper_token_account.amount;
    }
    let gatekeeper = &ctx.accounts.gatekeeper;
    let spl_token_program = &ctx.accounts.spl_token_program;
    let receiver_token_account = &ctx.accounts.receiver_token_account;
    let gatekeeper_token_account = &ctx.accounts.gatekeeper_token_account;

    let gatekeeper_authority_key = gatekeeper.authority.key();
    let gatekeeper_bump = gatekeeper.gatekeeper_bump.to_le_bytes();

    let authority_seed = &[
        GATEKEEPER_SEED.as_ref(),
        gatekeeper_authority_key.as_ref(),
        gatekeeper.gatekeeper_network.as_ref(),
        gatekeeper_bump.as_ref(),
    ][..];

    let transfer_instruction = Transfer {
        from: gatekeeper_token_account.to_account_info(),
        to: receiver_token_account.to_account_info(),
        authority: gatekeeper.to_account_info(),
    };

    let signer = &[authority_seed][..];
    let cpi_ctx = CpiContext::new_with_signer(
        spl_token_program.to_account_info(),
        transfer_instruction,
        signer,
    );

    anchor_spl::token::transfer(cpi_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct GatekeeperWithdrawAccount<'info> {
    #[account(
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump,
        constraint = gatekeeper.can_access(&authority, GatekeeperKeyFlags::WITHDRAW) @ GatekeeperErrors::InsufficientAccessAuthKeys,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    pub spl_token_program: Program<'info, Token>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub receiver_token_account: Account<'info, TokenAccount>,
    #[account(
    mut,
    constraint = gatekeeper_token_account.owner == *gatekeeper.to_account_info().key
    )]
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
